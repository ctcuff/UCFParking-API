import unittest
import sys

sys.path.append('../')

from app import app


class TestFrontEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # The '/' route should return html when the host is 'ucfgarages'
        app.config['SERVER_NAME'] = 'ucfgarages'

    def setUp(self):
        self.app = app.test_client()

    def test_index(self):
        page = self.app.get('/')

        self.assertEqual(page.status_code, 200)
        self.assertTrue(page.json is None)
        self.assertIn(b'<!DOCTYPE html>', page.data)

    def test_404(self):
        page = self.app.get('/some/invalid/route')

        self.assertEqual(page.status_code, 404)
        self.assertTrue(page.json is None)
        self.assertIn(b'<!DOCTYPE html>', page.data)

        page = self.app.get('/api')

        self.assertEqual(page.status_code, 404)
        self.assertTrue(page.json is None)
        self.assertIn(b'<!DOCTYPE html>', page.data)



if __name__ == '__main__':
    unittest.main()
