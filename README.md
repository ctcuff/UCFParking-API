# UCFParking-API
This is a 2-in-1 project. An unofficial API wrapper for [UCF's parking service](http://secure.parking.ucf.edu/GarageCount/) hosted as a Python app on Heroku, and a website to view a graph of the data. Why did I make this you ask? Instead of making a request to UCF's parking website and scraping the HTML, it now becomes as easy as making a request to https://ucf-garages.herokuapp.com/api and parsing the json.

How exactly is this useful you ask? Well, making a request to the `/api` route returns a JSON response with info about each parking garage (spaces taken, percent full, etc). Making a request to the `/data/all` route returns a JSON response with info about how full each garage was from January to the current date (<b>BEWARE</b>, this will return a lot of JSON as each hour passes). The list is updated at the top of every hour every day. To view a specific date, make a request to `/data/month/{month}/day/{day}` where `{month}` is an int representing the month (1 for January, 2 for February, etc) and `{day}` is an int representing the number day of that month. For example, [`https://ucf-garages.herokuapp.com/data/month/1/day/2`](https://ucf-garages.herokuapp.com/data/month/1/day/2) returns how full each garage was on January 2nd. Any date in the future will just return an empty JSON array that looks like this: `{ "data": [] }`

# How does it work?
Heroku scheduler is a Heroku addon that can run a command at set intervals. Every hour, Heroku runs the `curl` command to the `/add` route (which requires a key) which scrapes UCF's parking site, extracts the garage info, and saves it to a PostgreSQL database. The `/add` route requires a key to prevent a regular user from making a request and adding data outside of that hourly interval. The table looks something like this (the values aren't exact):

Date                       |id |garage_data                                               |month  |week |day
---------------------------|---|-----------------------------------------------------------|------|-----|---
2019-01-02T22:00:49.044984 |10  |{"garages": [{"name": "Garage A", "max_spaces": 1623...} |1      |0    |2
2019-01-02T23:01:23.357748 |11  |{"garages": [{"name": "Garage A", "max_spaces": 1623...} |1      |0    |2
2019-01-02T00:00:45.357748 |12  |{"garages": [{"name": "Garage A", "max_spaces": 1623...} |1      |0    |3
2019-01-02T01:00:16.357748 |13  |{"garages": [{"name": "Garage A", "max_spaces": 1623...} |1      |0    |3


### Sidenote
`config.py` contains a few import things: The url of the PostgreSQL database, the key needed to acces the `/add` route and a few credentials used by `email_helper.py`. `email_helper.py` contains a helper function used by `app.py` that sends an email to `TO` if something goes wrong. This is useful because you don't have to check the app everyday to make sure it's running. Although, if you don't want this feature, just remove the `send_email()` function from `app.py`. The email contains an error log and stacktrace. If you want to build this yourself, you'll need to set up the database and generate a random key, something like `c52452a7-4f68-4033-a40b-31ec188e5c30` (if you want to prevent regular access the the `/add` route). You'll also need an email address, port, and host of whatever email service you use (I'd highly recommend using gmail since this project already uses it). Once you've done that, create a `config.py` file that looks something like like this:
```python
DATABASE_URL = 'postgres://some-awesome-url-here'
# This will be some random key you'll generate.
# Don't use this specific value. I'd recommend using uuid4() from the uuid lib.
KEY = 'c52452a7-4f68-4033-a40b-31ec188e5c30'
FROM = 'from.someone@gmail.com'
TO = 'to.someone@gmail.com'
# This isn't the password for the actuall email address, it's a password for an app
# See: https://support.google.com/accounts/answer/185833?hl=en
PASSWORD = '16-digit-app-password-here'
# This will be the host / port for the email service used. Again, I'd recommend using gmail
HOST = 'smtp.gmail.com'
PORT = 587
```

### Sidenote part 2 (the sequel)
This code in this repo is actually 2 projects merged into one. The api is hosted on Heroku at https://ucf-garages.herokuapp.com/ while the website to view that data is hosted at https://ucfparking.herokuapp.com/.

### Available routes
* [`/api`](https://ucf-garages.herokuapp.com/api)
   * Returns JSON containing parking garage info (asumming UCF's parking website is still up...)
* [`/data/all`](https://ucf-garages.herokuapp.com/data/all)
  * Returns **ALL THE JSON AND WILL BE SLOW!!!**
* [`/data/today`](https://ucf-garages.herokuapp.com/data/today)
  * Returns data for the current date (starting at 12 AM)
* [`/data/week`](https://ucf-garages.herokuapp.com/data/week)
   * Returns data for the current week
   * Note that the first week starts at Jan, 2 since that was the day the sight first went up
   * Every other week starts on Sunday
* `/data/week/{week}`
   * For example: [`/data/week/1`](https://ucf-garages.herokuapp.com/data/week/1)
   * The range for `{week}` is 0 - 52
* [`/data/month`](https://ucf-garages.herokuapp.com/data/month)
  * Returns data for thecurrent month
* `/data/month/{month}`
   * For example: [`/data/month/1`](https://ucf-garages.herokuapp.com/data/month/1)
   * The range for `{month}` is 1 - 12
* `/data/month/{month}/day/{day}`
   * For example: [`/data/month/1/day/3`](https://ucf-garages.herokuapp.com/data/month/1/day/3)

### Example request to /api
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
         "percent_full": 0.0,
         "spaces_filled": 0,
         "spaces_left": 1623
      },
      {
         "max_spaces": 1259,
         "name": "Garage B",
         "percent_full": 38.6,
         "spaces_filled": 486,
         "spaces_left": 773
      },
      {
         "max_spaces": 1852,
         "name": "Garage C",
         "percent_full": 0.0,
         "spaces_filled": 0,
         "spaces_left": 1852
      },
      {
         "max_spaces": 1241,
         "name": "Garage D",
         "percent_full": 0.0,
         "spaces_filled": 0,
         "spaces_left": 1241
      },
      {
         "max_spaces": 1284,
         "name": "Garage H",
         "percent_full": 0.0,
         "spaces_filled": 0,
         "spaces_left": 1284
      },
      {
         "max_spaces": 1231,
         "name": "Garage I",
         "percent_full": 0.0,
         "spaces_filled": 0,
         "spaces_left": 1231
      },
      {
         "max_spaces": 1007,
         "name": "Garage Libra",
         "percent_full": 11.32,
         "spaces_filled": 114,
         "spaces_left": 893
      }
   ]
}
```

### Example request to /data/month/1/day/2
Using Python 3.x
```python
>>> from requests import get
>>> from json import dumps
>>> res = get('https://ucf-garages.herokuapp.com/data/month/1/day/2')
>>> dumps(res.json(), indent=3)
{
   "data": [
   {
      "date": "2019-01-02T03:00:49.044984",
      "day": 2,
      "garages": [
         {
            "max_spaces": 1623,
            "name": "Garage A",
            "percent_full": 0,
            "spaces_filled": 0,
            "spaces_left": 1623
         },
         {
            "max_spaces": 1259,
            "name": "Garage B",
            "percent_full": 51.31,
            "spaces_filled": 646,
            "spaces_left": 613
         },
         {
            "max_spaces": 1852,
            "name": "Garage C",
            "percent_full": 0,
            "spaces_filled": 0,
            "spaces_left": 1852
         },
         {
            "max_spaces": 1241,
            "name": "Garage D",
            "percent_full": 0,
            "spaces_filled": 0,
            "spaces_left": 1241
         },
         {
            "max_spaces": 1284,
            "name": "Garage H",
            "percent_full": 0,
            "spaces_filled": 0,
            "spaces_left": 1284
         },
         {
            "max_spaces": 1231,
            "name": "Garage I",
            "percent_full": 0,
            "spaces_filled": 0,
            "spaces_left": 1231
         },
         {
            "max_spaces": 1007,
            "name": "Garage Libra",
            "percent_full": 6.26,
            "spaces_filled": 63,
            "spaces_left": 944
         }
        ],
         "id": 4,
         "month": 1,
         "week": 0
      }
   ]
}
```
