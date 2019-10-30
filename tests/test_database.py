import unittest
import mongomock
import sys
from mongoengine import connect, disconnect, StringField, Document, ValidationError
from datetime import datetime
from json import load

sys.path.append('../')

from models import Garage, GarageEntry


class TestPerson(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        connect('mongoenginetest', host='mongomock://localhost', alias='testing')

    @classmethod
    def tearDownClass(cls):
        disconnect(alias='testing')

    def test_insert_garage(self):
        data_file = open('data/single_garage.json')
        dummy_data = load(data_file)

        data_file.close()

        date = datetime.now()

        garage = Garage(
            date=date.isoformat(),
            timestamp=int(date.timestamp()),
            day=date.day,
            week=int(date.strftime('%U')),
            month=date.month,
            garages=[
                GarageEntry(
                    max_spaces=entry['max_spaces'],
                    name=entry['name'],
                    percent_full=entry['percent_full'],
                    spaces_filled=entry['spaces_filled'],
                    spaces_left=entry['spaces_left'],
                )
                for entry in dummy_data
            ],
        )

        garage.save()

        self.assertEqual(garage.date, date.isoformat())
        self.assertEqual(garage.timestamp, int(date.timestamp()))
        self.assertEqual(garage.day, date.day),
        self.assertEqual(garage.week, int(date.strftime('%U')))
        self.assertEqual(garage.month, date.month)
        self.assertTrue(len(garage.garages) == 7)

        for i, garage in enumerate(garage.garages):
            entry = dummy_data[i]

            for key in entry.keys():
                self.assertEqual(getattr(garage, key), entry[key])

    def test_insert_invalid_garage(self):
        with self.assertRaises(ValidationError):
            garage = Garage()
            garage.save()

        with self.assertRaises(ValidationError):
            data_file = open('data/single_garage.json')
            dummy_data = load(data_file)
            data_file.close()

            dummy_data[0]['name'] = 'Garage Z'

            date = datetime.now()

            garage = Garage(
                date=date.isoformat(),
                timestamp=int(date.timestamp()),
                day=date.day,
                week=int(date.strftime('%U')),
                month=date.month,
                garages=[
                    GarageEntry(
                        max_spaces=entry['max_spaces'],
                        name=entry['name'],
                        percent_full=entry['percent_full'],
                        spaces_filled=entry['spaces_filled'],
                        spaces_left=entry['spaces_left'],
                    )
                    for entry in dummy_data
                ],
            )

            garage.save()


if __name__ == '__main__':
    unittest.main()
