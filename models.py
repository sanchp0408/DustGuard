# pyrefly: ignore [missing-import]
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Site(db.Model):
    id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    pm25 = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='green') # green, amber, red

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    message = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(20), default='info') # info, alert, ok

class SuppressionZone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.String(20), db.ForeignKey('site.id'), nullable=False)
    zone_name = db.Column(db.String(10), nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    pm_reading = db.Column(db.Float, default=0.0)

class Contractor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50)) # Excellent, Good, At Risk, Non-Compliant
    color = db.Column(db.String(20))
