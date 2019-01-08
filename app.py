import json
import traceback
from requests import get
from flask import Flask, jsonify, request, render_template
from bs4 import BeautifulSoup
from datetime import datetime
from sqlalchemy import and_
from flask_cors import CORS
from config import DATABASE_URL, KEY
from models import *
from email_helper import send_email

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL

# Allows requests from other languages
CORS(app)
db.init_app(app)


def jsonify_error(msg):
    return jsonify({'error': msg})


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api')
def api():
    url = 'http://secure.parking.ucf.edu/GarageCount/'
    page = get(url)

    if page.status_code != 200:
        send_email(f"An error occurred in api(): Couldn't parse HTML (is {url} down?):\n\n{page.text}")
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

    if len(garage_data['garages']) == 0:
        send_email(
            f'No garage data was found. '
            f'Check {url} to see if the website has changed or is no longer running'
        )

    return jsonify(garage_data)


@app.route('/add')
def add():
    header_key = request.headers.get('key')
    # Make sure normal users can add data to the database
    if header_key != KEY:
        return jsonify_error('Missing or invalid key')

    garage_data = get('https://ucf-garages.herokuapp.com/api')
    date = datetime.now()
    garage = Garage(
        date=str(date.isoformat()),
        garage_data=json.loads(garage_data.text),
        month=date.month,
        day=date.day,
        week=int(datetime.now().strftime('%U'))
    )

    try:
        db.session.add(garage)
        db.session.commit()
    except Exception as e:
        send_email(f'An error occurred in add(): {traceback.format_exc()}')
        return jsonify_error(f'Failed to add data: {str(e)}')

    return jsonify({'response': 'Successfully added data'})


@app.route('/data/all')
def get_all_data():
    return query_data(
        Garage.query
            .order_by(Garage.id.asc())
            .all()
    )


@app.route('/data/today')
def get_data_for_today():
    today = datetime.now()
    return get_data_at_day(today.month, today.day)


@app.route('/data/week')
def get_current_week():
    return get_data_at_week(int(datetime.now().strftime('%U')))


@app.route('/data/week/<int:week>')
def get_data_at_week(week):
    return query_data(
        Garage.query
        .filter_by(week=week)
        .order_by(Garage.id.asc())
        .all()
    )


@app.route('/data/month')
def get_current_month():
    month = datetime.now().month
    return query_data(
        Garage.query
        .filter_by(month=month)
        .order_by(Garage.id.asc())
        .all()
    )


@app.route('/data/month/<int:month>')
def get_data_at_month(month):
    return query_data(
        Garage.query
        .filter_by(month=month)
        .order_by(Garage.id.asc())
        .all()
    )


@app.route('/data/month/<int:month>/day/<int:day>')
def get_data_at_day(month, day):
    return query_data(
        Garage.query
        .filter(and_(Garage.month == month, Garage.day == day))
        .order_by(Garage.id.asc())
        .all()
    )


@app.errorhandler(404)
def error404(err):
    return jsonify_error('Page not found')


@app.errorhandler(500)
def error500(err):
    send_email(f'An internal server error occurred:\n\n{traceback.format_exc()}')
    return jsonify_error('Internal server error')


def query_data(query):
    data = {
        'data': [
            {
                'id': garage.id,
                'date': garage.date,
                'month': garage.month,
                'day': garage.day,
                'garage_data': garage.garage_data,
                'week': garage.week
            } for garage in query
        ]
    }
    return jsonify(data)


if __name__ == '__main__':
    app.run()
