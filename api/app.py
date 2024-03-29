import os
import traceback
import json
import dropbox
from threading import Thread
from dropbox.files import WriteMode
from flask import Flask, jsonify, request, render_template, send_from_directory
from models import Garage, GarageEntry
from bs4 import BeautifulSoup
from requests import get, exceptions
from email_helper import send_email
from mongoengine import connect
from flask_cors import CORS
from datetime import datetime
from urllib.parse import urlparse
from flask_talisman import Talisman
from dotenv import load_dotenv

load_dotenv(verbose=True)

app = Flask(__name__, template_folder='./dist', static_folder='./dist/static')
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.debug = os.getenv('DEBUG') == 'TRUE'

SCRAPE_URL = 'http://secure.parking.ucf.edu/GarageCount/'
SERVER_KEY = os.getenv('SERVER_KEY')

CORS(app)

if not app.debug:
    # Transforms all http requests to https
    Talisman(app, content_security_policy=None)

connect(host=os.getenv('DATABASE_HOST'), alias='default')


def jsonify_error(msg, error_code):
    return jsonify({'error': msg}), error_code


def is_api_request(base_url):
    """
    The site is hosted on Heroku with a custom domain so
    ucf-garages.herokuapp.com/* and api.ucfgarages.com/*
    should all return json responses while
    ucfgarages.com should return the actual html
    """

    if not base_url.startswith('http'):
        base_url = 'http://' + base_url

    url = urlparse(base_url)
    parts = url.hostname.split('.')

    return 'herokuapp' in parts or 'api' in parts


@app.before_request
def before_request():
    """
    If the request comes from ucfgarages.com and it's a 404, we'll
    and to the the 404 template. If it comes from api.ucfgarages,
    we'll show the 404 JSON response from `error404()`
    """

    if app.debug:
        # This allows 404 errors to show as JSON
        # instead of HTML while in debug mode
        return

    if not is_api_request(request.base_url):
        # /static isn't actually a valid route but we need to
        # allow static so we can load resources from /dist/static
        valid_routes = {'static', 'index', 'robots', 'favicon'}
        if request.endpoint not in valid_routes:
            return render_template('404.html'), 404


@app.route('/')
def index():
    if is_api_request(request.base_url):
        return api()

    return render_template('index.html')


@app.route('/api')
def api():
    # This route is needed since navigating to api.ucfgarages.com
    # really just routes to ucf-garages.herokuapp.com/api
    try:
        page = get(SCRAPE_URL, timeout=15)
    except exceptions.Timeout as e:
        send_email(
            f'A timeout occurred while requesting.'
            f'Check {SCRAPE_URL}, the site may be unavailable.\n\n{str(e)}'
        )
        return jsonify_error('Request timeout', 408)

    valid_garages = {
        'garage a', 'garage b', 'garage c', 'garage d', 'garage h', 'garage i', 'garage libra'
    }

    queried_garages = set(
        'garage ' + name.lower()
        for name in request.args.getlist('garages', type=str)
    )

    if page.status_code != 200:
        send_email(
            f"An error occurred in api(): "
            f"Couldn't parse HTML (is {SCRAPE_URL} down?):\n\n{page.text}"
        )
        return jsonify_error(
            f'Check {SCRAPE_URL}, the site may be unavailable or its contents may have changed.',
            page.status_code
        )

    soup = BeautifulSoup(page.content, 'html.parser')

    # This is the table that has the info about parking spaces
    table = soup.select('tr.dxgvDataRow_DevEx')
    garage_data = {'garages': []}

    for item in table:
        name = item.find('td').text

        # Skip any garages not named Garage <name>. This will only happen if
        # UCF decides to change the naming style for some reason
        if name.lower() not in valid_garages:
            continue

        # Skip garages that weren't passed in through
        # the query param (if that param exists of course)
        if queried_garages and name.lower() not in queried_garages:
            continue

        # Skip the first table row since it's just the header
        spaces = item.find_all('td')[1].text.rstrip().replace('\n', '').split('/')
        spaces_left = int(spaces[0])
        max_spaces = int(spaces[1])

        if spaces_left > max_spaces:
            spaces_left = max_spaces

        percent_full = round(((max_spaces - spaces_left) / max_spaces) * 100, 2)

        garage_data['garages'].append({
            'name': name,
            'max_spaces': max_spaces,
            'spaces_left': spaces_left,
            'spaces_filled': max_spaces - spaces_left,
            'percent_full': percent_full,
        })

    return jsonify(garage_data)


@app.route('/add')
def add():
    header_key = request.headers.get('key')

    # Make sure normal users can't add data to the database
    if header_key != SERVER_KEY:
        return jsonify_error('Missing or invalid key', 403)

    date = datetime.now()
    garage_data = api().json
    current_hour = datetime.now().hour
    last_entry = datetime.fromtimestamp(
        Garage.objects.order_by('-timestamp').first().timestamp
    )

    if 'error' in garage_data:
        send_email(
            "Garage data was not available. This was probably because the site was down. "
            "Check to see if UCF's parking site is up."
        )
        return jsonify_error('No data available to add.', 500)

    if last_entry.hour == current_hour:
        send_email(f'Could not add data, an entry already exists for hour {current_hour}')
        return jsonify_error('An entry with this hour already exists.', 403)

    # noinspection PyTypeChecker
    garage = Garage(
        date=date.isoformat(),
        timestamp=int(date.timestamp()),
        day=date.day,
        week=int(date.strftime('%U')),
        month=date.month,
        year=date.year,
        garages=[
            GarageEntry(
                max_spaces=entry['max_spaces'],
                name=entry['name'],
                percent_full=entry['percent_full'],
                spaces_filled=entry['spaces_filled'],
                spaces_left=entry['spaces_left']
            ) for entry in garage_data['garages']
        ]
    )

    try:
        garage.save()
    except Exception as e:
        send_email(f'An error occurred in add(): {traceback.format_exc()}')
        return jsonify_error(f'Failed to add data: {str(e)}', 500)

    upload = Thread(target=upload_backup)
    upload.start()

    return jsonify({'response': 'Successfully added data'})


@app.route('/all')
@app.route('/data/all')
def get_all_data():
    return query_database(Garage.objects(), request.args)


@app.route('/month/<int:month>/day/<int:day>')
@app.route('/data/month/<int:month>/day/<int:day>')
def get_data_at_day(month, day):
    return query_database(Garage.objects(day=day, month=month), request.args)


@app.route('/today')
@app.route('/data/today')
def get_data_for_today():
    today = datetime.now()
    return get_data_at_day(today.month, today.day)


@app.route('/week/<int:week>')
@app.route('/data/week/<int:week>')
def get_data_at_week(week):
    return query_database(Garage.objects(week=week), request.args)


@app.route('/week')
@app.route('/data/week')
def get_current_week():
    return get_data_at_week(datetime.now().strftime('%U'))


@app.route('/month/<int:month>')
@app.route('/data/month/<int:month>')
def get_data_at_month(month):
    return query_database(Garage.objects(month=month), request.args)


@app.route('/month')
@app.route('/data/month')
def get_current_month():
    return get_data_at_month(datetime.now().month)


@app.errorhandler(404)
def error404(err):
    return jsonify_error('Endpoint not found', 404)


@app.errorhandler(408)
def error408(err):
    send_email(
        f'Request timed out. '
        f'Check {SCRAPE_URL} to see if the connection is just slow.'
    )
    return jsonify_error('Request timed out', 408)


@app.errorhandler(500)
def error500(err):
    send_email(f'An internal server error occurred:\n\n{traceback.format_exc()}')
    return jsonify_error('Internal server error', 500)


@app.errorhandler(503)
def error503(err):
    # This error shows up as H12 on Heroku:
    # https://devcenter.heroku.com/articles/error-codes#h12-request-timeout
    send_email(
        f"Service unavailable. This could be a problem with Heroku or UCF's site"
        f'Check {SCRAPE_URL} to see if the connection is stable. '
        f'Check Heroku logs for more details.'
        f'\n\n{traceback.format_exc()}'
    )
    return jsonify_error('Service unavailable', 503)


@app.errorhandler(504)
def error504(err):
    send_email(
        f"Gateway timeout. This could be a problem with Heroku or UCF's site"
        f'Check {SCRAPE_URL} to see if the connection is stable. '
        f'\n\n{traceback.format_exc()}'
    )
    return jsonify_error('Gateway timeout', 504)


@app.route('/robots.txt')
def robots():
    return send_from_directory('.', 'robots.txt')


@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')


def query_database(objects, request_args):
    sort_order = {
        'asc': 'timestamp',
        'ascending': 'timestamp',
        'desc': '-timestamp',
        'descending': '-timestamp',
    }

    sort = request_args.get('sort', default='asc', type=str)
    year = request_args.get('year', default=datetime.now().year, type=int)
    garages = request_args.getlist('garages', type=str)

    if sort not in sort_order:
        sort = 'asc'

    data = objects.filter(year=year).exclude('id').order_by('timestamp', sort_order[sort])

    if not garages:
        return jsonify({
            'count': data.count(),
            'data': json.loads(data.to_json())
        })

    # Only return the garages that were passed through the
    # request header (if the header was present)
    data = data.aggregate({
        '$project': {
            '_id': False,
            'date': True,
            'day': True,
            'month': True,
            'timestamp': True,
            'week': True,
            'year': True,
            'garages': {
                '$filter': {
                    'input': '$garages',
                    'as': 'garage',
                    'cond': {
                        '$in': ['$$garage.name', [f'Garage {name}' for name in garages]]
                    }
                }
            }
        }
    })

    # Data that's aggregated returns a list of Documents
    # that don't have a to_json() or count() method
    res = list(data)

    return jsonify({
        'count': len(res),
        'data': res
    })


def upload_backup():
    """
    Saves a backup of all JSON data to Dropbox
    """

    with app.test_request_context():
        # noinspection PyBroadException
        try:
            dbx = dropbox.Dropbox(os.getenv('DBOX_TOKEN'))
            resp = get_all_data()
            content = json.dumps(resp.json, indent=2)

            file = dbx.files_upload(
                bytes(content, encoding='utf8'),
                os.getenv('BACKUP_PATH'),
                mode=WriteMode.overwrite
            )

            print(
                f'[{datetime.now().strftime("%a %B %d %Y %I:%M %p")}] '
                f'{file.path_display} saved successfully.'
            )
        except Exception:
            send_email(f'An error occurred while saving backup data: {traceback.format_exc()}')


if __name__ == '__main__':
    if not SERVER_KEY:
        raise RuntimeError(
            'A server key is required. Make sure your environment '
            'contains a variable named "SERVER_KEY"'
        )

    app.run(threaded=True)
