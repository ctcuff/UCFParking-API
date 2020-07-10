import dateutil.parser
from datetime import datetime
from mongoengine import (
    StringField,
    IntField,
    Document,
    ListField,
    LongField,
    EmbeddedDocument,
    FloatField,
    EmbeddedDocumentField,
    ValidationError
)

_GARAGES = [
    'Garage A',
    'Garage B',
    'Garage C',
    'Garage D',
    'Garage H',
    'Garage I',
    'Garage Libra',
]


class GarageEntry(EmbeddedDocument):
    max_spaces = IntField(required=True, min_value=0)
    name = StringField(required=True, choices=_GARAGES)
    percent_full = FloatField(required=True, min_value=0.0, max_value=100.0)
    spaces_filled = IntField(required=True, min_value=0)
    spaces_left = IntField(required=True, min_value=0)


class Garage(Document):
    # Specifies the cluster name
    meta = {'collection': 'ucf_garages'}
    current_year = datetime.now().year

    date = StringField(required=True, unique=True)
    timestamp = LongField(required=True, unique=True)
    day = IntField(required=True, min_value=1, max_value=31)
    week = IntField(required=True, min_value=0, max_value=52)
    month = IntField(required=True, min_value=1, max_value=12)
    year = IntField(required=True, min_value=2019, max_value=current_year)
    garages = ListField(EmbeddedDocumentField(GarageEntry), required=True)


    def clean(self):
        """
        Called by mongoengine before data is inserted into the db to
        verify that everything being inserted is valid
        """
        garages_used = set(_GARAGES)

        # Make sure the date passed in is valid
        try:
            dateutil.parser.parse(self.date)
        except (TypeError, ValueError, OverflowError) as e:
            raise ValidationError(f"Couldn't parse date: {e.args[0]}")

        if len(self.garages) != 7:
            raise ValidationError(
                f'Expected an array of length 7 but got an array of length {len(self.garages)}'
            )

        # Make sure each garage is entered exactly once
        for entry in self.garages:
            try:
                garages_used.remove(entry.name)
            except KeyError:
                raise ValidationError(f'Invalid garage name: {entry.name}')

        if len(garages_used) != 0:
            raise ValidationError(f'Entry missing garage(s): {garages_used}')
