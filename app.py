from requests import get
from flask import Flask, jsonify
from bs4 import BeautifulSoup

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True


@app.route('/')
def index():
    return api()


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


@app.errorhandler(404)
def error404(err):
    return jsonify({'error': 'Page not found'})


if __name__ == '__main__':
    app.run()
