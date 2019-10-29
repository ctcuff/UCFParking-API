import unittest
import requests
import sys

# Workaround to be able to import up a directory
sys.path.append('../')

from app import app

# The '/' route should return json when the host is 'api.ucfgarages'
app.config['SERVER_NAME'] = 'api.ucfgarages'


class TestApi(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.app = app.test_client()
        self.app.testing = True
        self.valid_garage_names = {
            'Garage A',
            'Garage B',
            'Garage C',
            'Garage D',
            'Garage H',
            'Garage I',
            'Garage Libra',
        }

    def test_debug(self):
        self.assertTrue(app.debug, msg='Make sure debug is enabled when running tests')

    def test_api(self):
        res = self.app.get('/api')
        data = res.json

        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(data, dict)
        self.assertEqual(len(data['garages']), len(self.valid_garage_names))
        self.validate_garage_data(data['garages'])

    def test_api_query(self):
        garage_list_query = ['A', 'Libra', 'Billy', 'This should be ignored']
        resp = self.app.get('/api', query_string={'garages': garage_list_query})
        data = resp.json

        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(data, dict)
        self.assertEqual(len(data['garages']), 2)
        self.validate_garage_data(data['garages'])

    def test_add_invalid_key(self):
        resp = self.app.get('/add', headers={'key': 'blaze-it-420'})
        self.assertEqual(resp.status_code, 403)

    def test_robots_txt_content(self):
        file = open('../robots.txt', encoding='utf8')
        file_contents = file.read()
        file.close()

        resp = self.app.get('/robots.txt')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(file_contents, resp.data.decode('utf8').replace('\r\n', '\n'))

    def test_404(self):
        resp = self.app.get('/some/invaid/route')
        self.assertEqual(resp.status_code, 404)

    def validate_garage_data(self, garages):
        """
        Makes sure each garage in the list of garages has valid data.
        Checks each `garage` in:

        ```
            "garages": [
                {
                    "max_spaces": 1623,
                    "name": "Garage A",
                    "percent_full": 3.7,
                    "spaces_filled": 60,
                    "spaces_left": 1563
                },
                {
                    "max_spaces": 1259,
                    "name": "Garage B",
                    "percent_full": 22.4,
                    "spaces_filled": 282,
                    "spaces_left": 977
                }
                ...
            ]
        ```
        """
        json_structure = {
            'max_spaces': int,
            'name': str,
            'percent_full': float,
            'spaces_filled': int,
            'spaces_left': int,
        }

        self.assertIsInstance(garages, list)

        for key, _type in json_structure.items():
            for garage in garages:
                self.assertIsInstance(garage[key], _type)

        for garage in garages:
            self.assertIsInstance(garage, dict)
            self.assertIn(garage['name'], self.valid_garage_names)
            self.assertEqual(
                garage['spaces_filled'] + garage['spaces_left'], garage['max_spaces']
            )
            self.assertTrue(
                garage['percent_full'] >= 0.0 and garage['percent_full'] <= 100.0
            )


if __name__ == '__main__':
    unittest.main()
