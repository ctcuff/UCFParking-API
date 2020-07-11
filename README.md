# UCFParking-API

<img width="1648" alt="Screen Shot 2020-06-23 at 3 58 28 AM" src="https://user-images.githubusercontent.com/7400747/87215801-1ce2c600-c308-11ea-9f0e-ba299e261b2d.png">
<p align="center"><sub>Fun Fact: Since starting this project the garages database his surpassed 13,000 entries 🎉</sub></p>

This is a 2-in-1 project. An unofficial API wrapper for [UCF's parking service](http://secure.parking.ucf.edu/GarageCount/) hosted as a Python app on Heroku, and a website to view a graph of the data. Why did I make this you ask? Instead of making a request to UCF's parking website and scraping the HTML, it now becomes as easy as making a request to [api.ucfgarages.com](https://api.ucfgarages.com) and parsing the json. You can view a graph of the data at [ucfgarages.com](https://ucfgarages.com).

How exactly is this useful you ask? Well, making a request to [api.ucfgarages.com/](https://api.ucfgarages.com/) returns a JSON response with info about each parking garage (spaces taken, percent full, etc). Making a request to the `/all` route returns a JSON response with info about how full each garage was from January to the current date (**BEWARE**, this will return a lot of JSON). The data is updated at the top of every hour every day. To view a specific date, make a request to `/month/:month/day/:day` where `:month` is an int representing the month (1 for January, 2 for February, etc) and `:day` is an int representing the number day of that month. For example, [api.ucfgarages.com/month/1/day/2](https://api.ucfgarages.com/month/1/day/2) returns how full each garage was on January 2nd. Any date in the future will just return an empty JSON array that looks like this:
```json
{
   "count": 0,
   "data": []
}
```

# How does it work?
Heroku scheduler is a Heroku addon that can run a command at set intervals. Every hour, Heroku runs the `curl` command to the `/add` route (which requires a key) which scrapes UCF's parking site, extracts the garage info, and saves it to a MongoDB database. The `/add` route requires a key to prevent a regular user from making a request and adding data outside of that hourly interval. The table looks something like this (the values aren't exact):

date                       |timestamp |day|week |month  |year |garage_data
---------------------------|--------- |---|-----|-------|-----|---------------------------------------------------------
2019-01-02T22:00:49.044984 |1546484465|2  |0    |1      |2019 |{"garages": [{"name": "Garage A", "max_spaces": 1623...}
2019-01-02T23:01:23.357748 |1546488063|2  |0    |1      |2019 |{"garages": [{"name": "Garage A", "max_spaces": 1623...}
2019-01-02T00:00:45.357748 |1546491676|3  |0    |1      |2019 |{"garages": [{"name": "Garage A", "max_spaces": 1623...}
2019-01-02T01:00:16.357748 |1546495277|3  |0    |1      |2019 |{"garages": [{"name": "Garage A", "max_spaces": 1623...}

### Sidenote
This code in this repo is actually 2 projects merged into one. The api is hosted at [api.ucfgarages.com](https://api.ucfgarages.com) while the website to view that data is hosted at [ucfgarages.com](https://ucfgarages.com). The heroku branch is what's actually pushed to Heroku. You can read more about this [here](https://github.com/ctcuff/UCFParking-API/tree/heroku#ucfparking-api)


# How do I build this?
## Requirements:
- Python 3.x
- yarn
- Docker
- A Gmail account for notifications (_Optional, see below_)
- A Dropbox account for backup (_Optional, see below_)

## Building the backend and frontend

0. Clone this project.
1. In the root directory, [create a Python virtual environment and activate it](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments). Once you have that up, run `pip install -r api/requirements.txt` to install the necessary dependencies.
2. To install packages for the for the frontend and setup the database, run the following commands (also in the root directory):
   1. `yarn install` (installs everything listed in `package.json`)
   2. `yarn build` (creates a `/dist` folder in `/api/dist`)
   3. `yarn db:init` (builds the database in a Docker container)
3. Create a Gmail app password for whatever email you'd like to use to get error notifications. [See here](https://support.google.com/accounts/answer/185833?hl=en). If you don't want email logs, just remove any occurrence of `send_email()` in `app.py`, get rid of `email_helper.py`, and ignore the email configuration in `.env`.
4. Head to [Dropbox's site](https://www.dropbox.com/developers/documentation/python#tutorial) to create a Python app and take note of the token. This will be used for saving a backup. If you don't want to do this, just delete occurrences of `upload_backup()` in `app.py` and remove `DBOX_TOKEN` and `BACKUP_PATH` in `.env`.
5. In the root directory create a file named `.env` that looks like this:
```bash
# This is for development purposes. When set to true, 404 errors
# will return JSON responses and http requests will not be
# redirected to https
DEBUG=TRUE

# This is the Mongo database you'll be connecting to. When running locally,
# this is the host name you'll be using
DATABASE_HOST=mongodb://localhost:27017/garages

# I'd recommend using Python's uuid4() from the uuid lib
SERVER_KEY=random_super_secure_key

# Relevant email info here. Note that EMAIL_PASSWORD isn't the password
# to the actual email account. For more info about setting this up see here:
# https://support.google.com/accounts/answer/185833?hl=en
EMAIL_FROM=from_someone@gmail.com
EMAIL_TO=to_someone@gmail.com
EMAIL_PASSWORD=app_password_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Dropbox configuration. The path is where backup
# data is stored in Dropbox
DBOX_TOKEN=token_from_dropbox
BACKUP_PATH=some_file.json

```
6. Once everything has been set up, run `app.py`. If it works, the `/api` route should give you a response that looks like [this](https://api.ucfgarages.com/) and the `/` route should show the graph!
7. Pat yourself on the back for following instructions, maybe have a cookie too 🍪.

**Side note:** Your local database won't have anything in it when you set it up. The data you see on the frontend is pulled from api.ucfgarages.com. To add data to the local db, run `curl --header "key: random_super_secure_key"`. You can verify the data was added by visiting the `/today` route on localhost. If you want to rerun container without resetting it, run `yarn db:run`.

**Pro Tip:** To view the db in your terminal run `docker exec -it db_garages bash`. This creates a new bash session inside the container. To enter the Mongo shell, run `mongo`. From there, you can run `help` to view an available list of commands.

## Setting up Heroku scheduler

I use Heroku Scheduler to insert data every hour automatically, because I'd be too lazy to do it myself otherwise. To get it up and running, install the [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) addon. You'll need to have it run the command: `curl --header "key: random_super_secure_key" https://your-project-name.herokuapp.com/add -v`. You can choose any frequency but I chose: `Hourly at :0`.

## Available routes
Note: these routes are for [api.ucfgarages.com](https://api.ucfgarages.com). Since the project use to be hosted only at [ucf-garages.herokuapp.com](https://ucf-garages.herokuapp.com), I had to use `/data/<route>` for any api requests. Since that's no longer the case, you don't need `/data` in any request (but it still works if you were using it before).

* [`/`](https://api.ucfgarages.com/)
   * Returns JSON containing parking garage info (assuming UCF's parking website is still up...)
* [`/all`](https://api.ucfgarages.com/all)
  * Returns **ALL THE JSON!!!** (for the current year. To query specific years, append `?year=<year>`. More info below...)
* [`/today`](https://api.ucfgarages.com/today)
  * Returns data for the current date (starting at 12 AM)
* [`/week`](https://api.ucfgarages.com/week)
   * Returns data for the current week
   * Note that the first week starts at Jan, 2 since that was the day the site first went up
   * Every other week starts on Sunday
* `/week/:week`
   * For example: [`/week/1`](https://api.ucfgarages.com/week/1)
   * The range for `:week` is 0 - 52
* [`/month`](https://api.ucfgarages.com/month)
  * Returns data for the current month
* `/month/:month`
   * For example: [`/month/1`](https://api.ucfgarages.com/month/1)
   * The range for `:month` is 1 - 12
* `/month/:month/day/:day`
   * For example: [`/month/1/day/3`](https://api.ucfgarages.com/month/1/day/3)

### Query parameters
* `sort: string`
  * Possible values: `asc`, `ascending`, `desc`, `descending`. The default sort order is `ascending`.
  * For example: api.ucfgarages.com/week?sort=desc
* `year: int`
   * Specifies what year the api should return data from. The default is the current year.
   * Possible values: `2019 - <current year>`
   * For example: [api.ucfgarages.com/month/1?year=2019](https://api.ucfgarages.com/month/1?year=2019)
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
            "week": 42,
            "year": 2019
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
         "week": 0,
         "year": 2019
      },
      ...
   ]
}
```
