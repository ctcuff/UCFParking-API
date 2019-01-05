from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Garage(db.Model):
    __tablename__ = 'GarageData'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date = db.Column(db.Text, nullable=False)
    garage_data = db.Column(db.JSON, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    day = db.Column(db.Integer, nullable=False)
    week = db.Column(db.Integer, nullable=False)
