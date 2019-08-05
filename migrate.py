from models import Garage, GarageEntry
from config import DATABASE_CONFIG
from mongoengine import connect, disconnect
from requests import get
from dateutil.parser import parse


def migrate():
    """
    Take all data currently in the PostgreSQL database
    and insert it into the MongoDB database
    """
    resp = get('https://ucf-garages.herokuapp.com/data/all')
    entries = []
    garage_data = resp.json()

    for entry in garage_data['data']:
        print(f'{len(garage_data["data"]) - len(entries)} entries remaining...')
        # noinspection PyTypeChecker
        entries.append(
            Garage(
                date=entry['date'],
                timestamp=parse(entry['date']).timestamp(),
                day=entry['day'],
                week=entry['week'],
                month=entry['month'],
                garage_data=[
                    GarageEntry(
                        max_spaces=entry['max_spaces'],
                        name=entry['name'],
                        percent_full=entry['percent_full'],
                        spaces_filled=entry['spaces_filled'],
                        spaces_left=entry['spaces_left']
                    ) for entry in entry['garages']
                ]
            )
        )

    try:
        Garage.objects.insert(entries)
    except Exception as e:
        print(f"Couldn't insert data: {str(e)}")


if __name__ == '__main__':
    # noinspection PyBroadException
    try:
        connect(
            db=DATABASE_CONFIG['TABLE_NAME'],
            username=DATABASE_CONFIG['USERNAME'],
            password=DATABASE_CONFIG['PASSWORD'],
            host=DATABASE_CONFIG['HOST'],
            alias='default'
        )
        migrate()
    except Exception as err:
        print(f'An error occurred during migration: {str(err)}')
    finally:
        disconnect()
