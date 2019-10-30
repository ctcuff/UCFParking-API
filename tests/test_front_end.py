import unittest
import requests
import sys

sys.path.append('../')

from app import app


class TestApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # The '/' route should return html when the host is 'ucfgarages'
        app.config['SERVER_NAME'] = 'ucfgarages'

    @classmethod
    def setUp(self):
        self.app = app.test_client()

    def test_index(self):
        file = open('../dist/index.html', encoding='utf8')
        index_html = file.read()
        file.close()

        resp = self.app.get('/')
        self.assertTrue(resp.json is None)
        self.assertEqual(index_html, resp.data.decode('utf8').replace('\r\n', '\n'))


if __name__ == '__main__':
    unittest.main()
