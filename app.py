import json
from requests import get
from flask import Flask, jsonify, request, render_template
from bs4 import BeautifulSoup
from datetime import datetime
from sqlalchemy import and_
from flask_cors import CORS
from config import DATABASE_URL, KEY
from models import *

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL

# Allows requests from other languages
CORS(app)
db.init_app(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api')
def api():
    page = get('http://secure.parking.ucf.edu/GarageCount/')

    if page.status_code != 200:
        return jsonify({'error': page.text})

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
    return jsonify(garage_data)


@app.route('/add')
def add():
    header_key = request.headers.get('key')
    # Make sure normal users can add data to the database
    if header_key != KEY:
        return jsonify({'result': 'Error: missing or invalid key'})

    garage_data = get('https://ucf-garages.herokuapp.com/api')
    date = datetime.now()
    garage = Garage(
        date=str(date.isoformat()),
        garage_data=json.loads(garage_data.text),
        month=date.month,
        day=date.day
    )

    try:
        db.session.add(garage)
        db.session.commit()
    except Exception as e:
        return jsonify({'result': f'Failed to add data: {str(e)}'})

    return jsonify({'result': 'Successfully added data'})


@app.route('/data/today')
def get_data_for_today():
    today = datetime.now()
    return get_data_at_day(today.month, today.day)


@app.route('/data/all')
def get_data():
    return query_data(
        Garage.query
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
    return jsonify({'error': 'Page not found'})


@app.errorhandler(500)
def error500(err):
    return jsonify({'error': 'Internal server error'})


def query_data(query):
    data = {
        'data': [
            {
                'id': garage.id,
                'date': garage.date,
                'month': garage.month,
                'day': garage.day,
                'garage_data': garage.garage_data
            } for garage in query
        ]
    }
    return jsonify(data)


if __name__ == '__main__':
    app.run()
