# UCFParking-API
This is a 2-in-1 project. An unofficial API wrapper for [UCF's parking service](http://secure.parking.ucf.edu/GarageCount/) hosted as a Python app on Heroku, and a website to view a graph of the data. Why did I make this you ask? Instead of making a request to UCF's parking website and scraping the HTML, it now becomes as easy as making a request to https://ucf-garages.herokuapp.com/api and parsing the json.

How exactly is this useful you ask? Well, making a request to the `/api` route returns a JSON response with info about each parking garage (spaces taken, percent full, etc). Making a request to the `/data/all` route returns a JSON response with info about how full each garage was from January to the current date (**BEWARE**, as of now, this will return a lot of JSON. It will be paginated eventually, but that's something I'm still working on). The list is updated at the top of every hour every day. To view a specific date, make a request to `/data/month/{month}/day/{day}` where `{month}` is an int representing the month (1 for January, 2 for February, etc) and `{day}` is an int representing the number day of that month. For example, [`https://ucf-garages.herokuapp.com/data/month/1/day/2`](https://ucf-garages.herokuapp.com/data/month/1/day/2) returns how full each garage was on January 2nd. Any date in the future will just return an empty JSON array that looks like this:
```json
{
   "count": 0,
   "data": []
}
```

# How does it work?
Heroku scheduler is a Heroku addon that can run a command at set intervals. Every hour, Heroku runs the `curl` command to the `/add` route (which requires a key) which scrapes UCF's parking site, extracts the garage info, and saves it to a MongoDB database. The `/add` route requires a key to prevent a regular user from making a request and adding data outside of that hourly interval. The table looks something like this (the values aren't exact):

date                       |timestamp |day|week |month  |garage_data
---------------------------|--------- |---|-----|-------|---------------------------------------------------------
2019-01-02T22:00:49.044984 |1546484465|2  |0    |1      |{"garages": [{"name": "Garage A", "max_spaces": 1623...}
2019-01-02T23:01:23.357748 |1546488063|2  |0    |1      |{"garages": [{"name": "Garage A", "max_spaces": 1623...}
2019-01-02T00:00:45.357748 |1546491676|3  |0    |1      |{"garages": [{"name": "Garage A", "max_spaces": 1623...}
2019-01-02T01:00:16.357748 |1546495277|3  |0    |1      |{"garages": [{"name": "Garage A", "max_spaces": 1623...}


### Sidenote
`config.py` contains a few import things: the url of the MongoDB database, the key needed to access the `/add` route, a few credentials used by `email_helper.py`, and an api key for uploading a backup of the json data to Dropbox. `email_helper.py` contains a helper function used by `app.py` that sends an email to `TO` if something goes wrong. This is useful because you don't have to check the app everyday to make sure it's running. Although, if you don't want this feature, just remove the `send_email()` function from `app.py`. The email contains an error log and stacktrace. If you want to build this yourself, you'll need to set up the database and generate a random key, something like `c52452a7-4f68-4033-a40b-31ec188e5c30` (if you want to prevent regular access the the `/add` route). You'll also need an email address, port, and host of whatever email service you use (I'd highly recommend using Gmail since this project already uses it). Once you've done that, create a `config.py` file that looks something like like this:
```python
DATABASE_CONFIG = {
    'TABLE_NAME': 'table_name_here',
    'USERNAME': 'username',
    'PASSWORD': 'db_password',
    'HOST': 'mongodb+srv://cluster-blah-blah-blah'
}

EMAIL_CONFIG = {
    'FROM': 'from.someone@gmail.com',
    'TO': 'to.someone@gmail.com',
    # This isn't the password for the actual email address, it's a password
    # for an app. See: https://support.google.com/accounts/answer/185833?hl=en
    'PASSWORD': '16-digit-app-password-here',
    # This will be the host / port for the email service used.
    # Again, I'd recommend using Gmail since I used it in this project
    'HOST': 'smtp.gmail.com',
    'PORT': 587
}

SERVER_CONFIG = {
    # I'd recommend using uuid4() from the uuid lib.
    'KEY': 'random-key here',
    # You'll get this key after creating a Dropbox app.
    # See: https://www.dropbox.com/developers/documentation/python#tutorial
    'DBOX_TOKEN': 'your-token-here'
}
```

### Sidenote part 2 (the sequel)
This code in this repo is actually 2 projects merged into one. The api is hosted on Heroku at https://ucf-garages.herokuapp.com/ while the website to view that data is hosted at https://ucfparking.herokuapp.com/.


# How do I build this?
Prerequisites: `Python >= 3.6` and `npm`

### Building the backend and frontend

0. Clone this project.
1. In the root directory, run `virtualenv env` then `source env/bin/activate` or `env\Scripts\activate` depending on your OS. Once you have that up, run `pip install -r api/requirements.txt`.
2. To install packages for the for the frontend, run `npm install` (also in the root directory).
3. In `/api`, create a file named `config.py` that looks like the file described above.
4. Create a Gmail app password for whatever email you'd like to use to get error notifications. [See here](https://support.google.com/accounts/answer/185833?hl=en). If you don't want email logs, just remove any occurrence of `send_email()` in `app.py`, get rid of `email_helper.py`, and ignore the `EMAIL_CONFIG` in `config.py`.
5. Head to [MongoDB's cloud site](https://www.mongodb.com/cloud) to create a cluster. Once that's set up, open the connect dialog and choose `Connect Your Application` for Python 3.6 or later.
6. Head to [Dropbox's site](https://www.dropbox.com/developers/documentation/python#tutorial) to create a Python app and take note of the token. This will be used for saving a backup. If you don't want to do this, just delete the `upload_backup()` function at the bottom of `app.py` and remove `DBOX_TOKEN` from `SERVER_CONFIG` in `config.py`.
7. In `config.py`, replace the values for database config with your MongoDB cluster password, username, table name, and host name. Replace the values for Gmail and dropbox settings and generate a server key.
8. Once the backend has been set up, run `app.py`. If it works, the `/` and `/api` routes should give you a response that looks like [this](https://ucf-garages.herokuapp.com/).
9. To run the frontend, run `npm run serve` in the root directory (note that the site probably won't display any graphs if the database is empty, see below).

### Setting up Heroku scheduler

In order to actually see the data, you'll need to have data in the database (I know, it's crazy right ?). I use Heroku Scheduler to insert data every hour automatically, because I'd be too lazy to do it myself otherwise. **Note**: if you change the db schema, things will break and you and your code will be sad. Bad rhymes with sad, and being sad is bad.

0. Go to [Heroku's site](https://dashboard.heroku.com/apps) and create a new Python app.
1. Upload the contents of `/api` to your Heroku project.
2. Install the [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) addon. You'll need to have it run the command: `curl --header "key: your-secure-key-here" https://your-project-name.herokuapp.com/add -v`. You can choose any frequency but I chose: `Hourly at :0`.

### Available routes
* [`/`](https://ucf-garages.herokuapp.com/) or [`/api`](https://ucf-garages.herokuapp.com/api)
   * Returns JSON containing parking garage info (assuming UCF's parking website is still up...)
* [`/data/all`](https://ucf-garages.herokuapp.com/data/all)
  * Returns **ALL THE JSON!!!**. This will probably be paginated eventually.
* [`/data/today`](https://ucf-garages.herokuapp.com/data/today)
  * Returns data for the current date (starting at 12 AM)
* [`/data/week`](https://ucf-garages.herokuapp.com/data/week)
   * Returns data for the current week
   * Note that the first week starts at Jan, 2 since that was the day the site first went up
   * Every other week starts on Sunday
* `/data/week/{week}`
   * For example: [`/data/week/1`](https://ucf-garages.herokuapp.com/data/week/1)
   * The range for `{week}` is 0 - 52
* [`/data/month`](https://ucf-garages.herokuapp.com/data/month)
  * Returns data for the current month
* `/data/month/{month}`
   * For example: [`/data/month/1`](https://ucf-garages.herokuapp.com/data/month/1)
   * The range for `{month}` is 1 - 12
* `/data/month/{month}/day/{day}`
   * For example: [`/data/month/1/day/3`](https://ucf-garages.herokuapp.com/data/month/1/day/3)

### Query parameters
* `sort: string`
  * Possible values: `asc`, `ascending`, `desc`, `descending`. The default sort order is `ascending`.
  * For example: `https://ucf-garages.herokuapp.com/data/week?sort=desc`
* `garages: array`
   * Specifies which garages should be returned in a response. Note that this works for **every** route!
   * Possible values: `A`, `B`, `C`, `D`, `H`, `I`, `Libra` (all case sensitive)
   * For example: `https://ucf-garages.herokuapp.com/data/today?garages=A&garages=Libra` returns:
   ```python
   {
      "count": 21,
      "data": [
         {
            "date": "2019-10-26T00:03:05.907566",
            "day": 26,
            "garages": [
               {
                  "max_spaces": 1623,
                  "name": "Garage A",
                  "percent_full": 0.0,
                  "spaces_filled": 0,
                  "spaces_left": 1623
               },
               {
                  "max_spaces": 1007,
                  "name": "Garage Libra",
                  "percent_full": 54.32,
                  "spaces_filled": 547,
                  "spaces_left": 460
               }
            ],
            "month": 10,
            "timestamp": 1572062585,
            "week": 42
         },
         ...
      ]
   }
   ```
   * Another example: `https://ucf-garages.herokuapp.com/?garages=H`
   ```json
   {
      "garages": [
         {
            "max_spaces": 1241,
            "name": "Garage H",
            "percent_full": 5.0,
            "spaces_filled": 62,
            "spaces_left": 1179
         }
      ]
   }
   ```


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
   "count": 21,
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
         "month": 1,
         "timestamp": 1546488063,
         "week": 0
      }
   ]
}
```
