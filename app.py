import traceback
import json
from threading import Thread
import dropbox
from dropbox.files import WriteMode
from flask import Flask, jsonify, request
from config import DATABASE_CONFIG, SERVER_CONFIG
from models import Garage, GarageEntry
from bs4 import BeautifulSoup
from requests import get
from email_helper import send_email
from mongoengine import connect
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
SCRAPE_URL = 'http://secure.parking.ucf.edu/GarageCount/'
dbx = dropbox.Dropbox(SERVER_CONFIG['DBOX_TOKEN'])
CORS(app)
connect(
    db=DATABASE_CONFIG['TABLE_NAME'],
    username=DATABASE_CONFIG['USERNAME'],
    password=DATABASE_CONFIG['PASSWORD'],
    host=DATABASE_CONFIG['HOST'],
    alias='default'
)


def jsonify_error(msg):
    return jsonify({'error': msg})


@app.route('/')
@app.route('/api')
def api():
    page = get(SCRAPE_URL)

    if page.status_code != 200:
        send_email(f"An error occurred in api(): Couldn't parse HTML (is {SCRAPE_URL} down?):\n\n{page.text}")
        return jsonify_error(page.text)

    soup = BeautifulSoup(page.content, 'html.parser')

    # This is the table that has the info about parking spaces
    table = soup.select('tr.dxgvDataRow_DevEx')
    garage_data = {'garages': []}

    for item in table:
        name = item.find('td').text

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

    if len(garage_data['garages']) != 7:
        send_email(
            f'Invalid data length. '
            f'Check {SCRAPE_URL} to see if the website has changed or is no longer running'
        )

    return jsonify(garage_data)


@app.route('/add')
def add():
    header_key = request.headers.get('key')

    # Make sure normal users can't add data to the database
    if header_key != SERVER_CONFIG['KEY']:
        return jsonify_error('Missing or invalid key')

    date = datetime.now()
    garage_data = api().json

    if 'error' in garage_data:
        send_email(
            "Garage data was not available. This was probably because the site was down. "
            "Check to see if UCF's parking site is up."
        )
        return

    # noinspection PyTypeChecker
    garage = Garage(
        date=date.isoformat(),
        timestamp=int(date.timestamp()),
        day=date.day,
        week=int(date.strftime('%U')),
        month=date.month,
        garage_data=[
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
        return jsonify_error(f'Failed to add data: {str(e)}')

    upload = Thread(target=upload_backup)
    upload.start()

    return jsonify({'response': 'Successfully added data'})


@app.route('/data/all')
def get_all_data():
    return query_database(
        Garage.objects(),
        request.args.get('sort')
    )


@app.route('/data/month/<int:month>/day/<int:day>')
def get_data_at_day(month, day):
    return query_database(
        Garage.objects(day=day, month=month),
        request.args.get('sort')
    )


@app.route('/data/today')
def get_data_for_today():
    today = datetime.now()
    return get_data_at_day(today.month, today.day)


@app.route('/data/week/<int:week>')
def get_data_at_week(week):
    return query_database(
        Garage.objects(week=week),
        request.args.get('sort')
    )


@app.route('/data/week')
def get_current_week():
    return get_data_at_week(datetime.now().strftime('%U'))


@app.route('/data/month/<int:month>')
def get_data_at_month(month):
    return query_database(
        Garage.objects(month=month),
        request.args.get('sort')
    )


@app.route('/data/month')
def get_current_month():
    return get_data_at_month(datetime.now().month)


@app.errorhandler(404)
def error404(err):
    return jsonify_error('Page not found')


@app.errorhandler(408)
def error408(err):
    send_email(
        f'Request timed out. '
        f'Check {SCRAPE_URL} to see if the connection is just slow.'
    )
    return jsonify_error('Request timed out')


@app.errorhandler(500)
def error500(err):
    send_email(f'An internal server error occurred:\n\n{traceback.format_exc()}')
    return jsonify_error('Internal server error')


def query_database(objects, sort):
    sort_order = {
        'asc': 'timestamp',
        'ascending': 'timestamp',
        'desc': '-timestamp',
        'descending': '-timestamp',
    }

    if sort not in sort_order:
        sort = 'asc'

    data = objects.order_by('timestamp', sort_order[sort]).exclude('id')

    return jsonify({
        'count': data.count(),
        'data': json.loads(data.to_json())
    })


def upload_backup():
    """
    Saves a backup of all json to Dropbox
    """

    # noinspection PyBroadException
    try:
        resp = get('https://ucf-garages.herokuapp.com/data/all')
        content = json.dumps(resp.json(), indent=2)

        status = dbx.files_upload(
            bytes(content, encoding='utf8'),
            '/ucf-garage-backup/data_backup.json',
            mode=WriteMode('overwrite')
        )

        print(status)

    except Exception:
        send_email(f'An error occurred while saving backup data: {traceback.format_exc()}')


if __name__ == '__main__':
    app.run(threaded=True)
