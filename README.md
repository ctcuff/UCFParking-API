# UCFParking-API
This is an unofficial API wrapper for [UCF's parking service](http://secure.parking.ucf.edu/GarageCount/) hosted as a Python app on Heroku. Why did I make this you ask? Instead of making a request to UCF's parking website and scraping the HTML, it now becomes as easy as making a request to [this API](https://ucf-garages.herokuapp.com/api) and parsing the json.

## Example
Using Python 3.x
```python
>>> from requests import get
>>> from json import dumps
>>> res = get('https://ucf-garages.herokuapp.com/api')
>>> dumps(res.json(), indent=3)
{
   "garages": [
      {
         "max_spaces": 1623,
         "name": "Garage A",
         "percent_full": 0.43,
         "spaces_left": 1616
      },
      {
         "max_spaces": 1259,
         "name": "Garage B",
         "percent_full": 38.44,
         "spaces_left": 775
      },
      {
         "max_spaces": 1852,
         "name": "Garage C",
         "percent_full": 0.11,
         "spaces_left": 1850
      },
      {
         "max_spaces": 1241,
         "name": "Garage D",
         "percent_full": 0.24,
         "spaces_left": 1238
      },
      {
         "max_spaces": 1284,
         "name": "Garage H",
         "percent_full": 100.0,
         "spaces_left": 0
      },
      {
         "max_spaces": 1231,
         "name": "Garage I",
         "percent_full": 18.03,
         "spaces_left": 1009
      },
      {
         "max_spaces": 1007,
         "name": "Garage Libra",
         "percent_full": 11.42,
         "spaces_left": 892
      }
   ]
}
```
