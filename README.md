# UCFParking-API
This is a 2-in-1 project. An unofficial API wrapper for [UCF's parking service](http://secure.parking.ucf.edu/GarageCount/) hosted as a Python app on Heroku, and a website to view a graph of the data. Why did I make this you ask? Instead of making a request to UCF's parking website and scraping the HTML, it now becomes as easy as making a request to [api.ucfgarages.com](https://api.ucfgarages.com) and parsing the json. You can view a graph of the data at [ucfgarages.com](https://ucfgarages.com).

How exactly is this useful you ask? Well, making a request to [api.ucfgarages.com/](https://api.ucfgarages.com/) returns a JSON response with info about each parking garage (spaces taken, percent full, etc). Making a request to the `/all` route returns a JSON response with info about how full each garage was from January to the current date (**BEWARE**, as of now, this will return a lot of JSON. It will be paginated eventually, but that's something I'm still working on). The list is updated at the top of every hour every day. To view a specific date, make a request to `/month/{month}/day/{day}` where `{month}` is an int representing the month (1 for January, 2 for February, etc) and `{day}` is an int representing the number day of that month. For example, [api.ucfgarages.com/month/1/day/2](https://api.ucfgarages.com/month/1/day/2) returns how full each garage was on January 2nd. Any date in the future will just return an empty JSON array that looks like this:
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
This code in this repo is actually 2 projects merged into one. The api is hosted at [api.ucfgarages.com](https://api.ucfgarages.com) while the website to view that data is hosted at [ucfgarages.com](https://ucfgarages.com).


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
8. Once the backend has been set up, run `app.py`. If it works, the `/api` route should give you a response that looks like [this](https://api.ucfgarages.com/).
9. To run the frontend, run `npm run build` in the root directory. That should create a `/dist` folder in `/api/dist`. Now when you run `app.py` and view the `/` route, you should see the frontend (note that the site probably won't display any graphs if the database is empty, see below).

### Setting up Heroku scheduler

In order to actually see the data, you'll need to have data in the database (I know, it's crazy right ?). I use Heroku Scheduler to insert data every hour automatically, because I'd be too lazy to do it myself otherwise. **Note**: if you change the db schema, things will break and you and your code will be sad. Bad rhymes with sad, and being sad is bad.

0. Go to [Heroku's site](https://dashboard.heroku.com/apps) and create a new Python app.
1. Upload the contents of `/api` to your Heroku project.
2. Install the [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) addon. You'll need to have it run the command: `curl --header "key: your-secure-key-here" https://your-project-name.herokuapp.com/add -v`. You can choose any frequency but I chose: `Hourly at :0`.

### Available routes
Note: these routes are for [api.ucfgarages.com](https://api.ucfgarages.com). Since the project use to be hosted only at [ucf-garages.herokuapp.com](https://ucf-garages.herokuapp.com), I had to use `/data/<route>` for any api requests. Since that's no longer the case, you don't need `/data` in any request (but it still work if you were using it before).

* [`/`](https://api.ucfgarages.com/)
   * Returns JSON containing parking garage info (assuming UCF's parking website is still up...)
* [`/all`](https://api.ucfgarages.com/all)
  * Returns **ALL THE JSON!!!**. This will probably be paginated eventually.
* [`/today`](https://api.ucfgarages.com/today)
  * Returns data for the current date (starting at 12 AM)
* [`/week`](https://api.ucfgarages.com/week)
   * Returns data for the current week
   * Note that the first week starts at Jan, 2 since that was the day the site first went up
   * Every other week starts on Sunday
* `/week/{week}`
   * For example: [`/week/1`](https://api.ucfgarages.com/week/1)
   * The range for `{week}` is 0 - 52
* [`/month`](https://api.ucfgarages.com/month)
  * Returns data for the current month
* `/month/{month}`
   * For example: [`/month/1`](https://api.ucfgarages.com/month/1)
   * The range for `{month}` is 1 - 12
* `/month/{month}/day/{day}`
   * For example: [`/month/1/day/3`](https://api.ucfgarages.com/month/1/day/3)

### Query parameters
* `sort: string`
  * Possible values: `asc`, `ascending`, `desc`, `descending`. The default sort order is `ascending`.
  * For example: api.ucfgarages.com/week?sort=desc
* `garages: array`
   * Specifies which garages should be returned in a response. Note that this works for **every** route!
   * Possible values: `A`, `B`, `C`, `D`, `H`, `I`, `Libra` (all case sensitive)
   * For example: [api.ucfgarages.com/today?garages=A&garages=Libra](https://api.ucfgarages.com/today?garages=A&garages=Libra) returns:
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
   * Another example: [api.ucfgarages.com/?garages=H](https://api.ucfgarages.com/?garages=H)
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


### Example request to /
Using Python 3.x
```python
>>> from requests import get
>>> from json import dumps
>>> res = get('https://api.ucfgarages.com/')
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

### Example request to /month/1/day/2
Using Python 3.x
```python
>>> from requests import get
>>> from json import dumps
>>> res = get('https://api.ucfgarages.com/month/1/day/2')
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
      },
      ...
   ]
}
```
