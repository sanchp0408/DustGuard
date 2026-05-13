# pyrefly: ignore [missing-import]
from flask import Flask, jsonify, request, render_template
from models import db, Site, Event, SuppressionZone, Contractor
from datetime import datetime, timedelta
import random
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dustguard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Helper to seed data
def seed_data():
    if Site.query.first():
        return
    
    sites = [
        Site(id='BLR-WF-001', name='Whitefield Ring Road', pm25=124.0, status='red'),
        Site(id='BLR-MH-092', name='Marathahalli Flyover', pm25=82.0, status='amber'),
        Site(id='BLR-HB-045', name='Hebbal Expressway', pm25=45.0, status='green'),
        Site(id='BLR-KM-112', name='Koramangala Metro', pm25=58.0, status='green'),
        Site(id='BLR-EC-201', name='Electronic City Ph2', pm25=94.0, status='amber')
    ]
    db.session.add_all(sites)

    contractors = [
        Contractor(name='GreenBuild Infra', score=94, status='Excellent', color='#1D9E75'),
        Contractor(name='Hebbal Roads Ltd', score=81, status='Good', color='#378ADD'),
        Contractor(name='UrbanArc Projects', score=72, status='At Risk', color='#EF9F27'),
        Contractor(name='TechBuild Infra', score=48, status='Non-Compliant', color='#E24B4A'),
        Contractor(name='FastTrack Constr.', score=31, status='Non-Compliant', color='#E24B4A')
    ]
    db.session.add_all(contractors)

    # Zones for Marathahalli
    for char in ['A', 'B', 'C', 'D', 'E', 'F']:
        zone = SuppressionZone(site_id='BLR-MH-092', zone_name=char, is_active=False, pm_reading=random.uniform(50, 100))
        db.session.add(zone)

    db.session.add(Event(message="System initialized. Monitoring 142 sites.", type="info"))
    db.session.commit()

with app.app_context():
    db.create_all()
    seed_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dashboard')
def dashboard():
    sites = Site.query.all()
    avg_pm = db.session.query(db.func.avg(Site.pm25)).scalar() or 0
    return jsonify({
        'sites': [{
            'id': s.id,
            'name': s.name,
            'pm': s.pm25,
            'status': s.status
        } for s in sites],
        'stats': {
            'active_sites': 142,
            'avg_pm25': round(avg_pm, 1),
            'suppressions_today': 1248,
            'violations_blocked': 86
        }
    })

@app.route('/api/events')
def get_events():
    events = Event.query.order_by(Event.timestamp.desc()).limit(20).all()
    return jsonify([{
        'id': e.id,
        'timestamp': e.timestamp.strftime('%H:%M:%S'),
        'message': e.message,
        'type': e.type
    } for e in events])

@app.route('/api/zones/<site_id>')
def get_zones(site_id):
    zones = SuppressionZone.query.filter_by(site_id=site_id).all()
    return jsonify([{
        'id': z.id,
        'name': z.zone_name,
        'is_active': z.is_active,
        'pm': round(z.pm_reading, 1)
    } for z in zones])

@app.route('/api/zones/toggle', methods=['POST'])
def toggle_zone():
    data = request.json
    zone = SuppressionZone.query.get(data['id'])
    if zone:
        zone.is_active = data['active']
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'success': False}), 404

@app.route('/api/contractors')
def get_contractors():
    contractors = Contractor.query.all()
    return jsonify([{
        'name': c.name,
        'score': c.score,
        'status': c.status,
        'color': c.color
    } for c in contractors])

@app.route('/api/simulate/detection', methods=['POST'])
def simulate_detection():
    # This logic creates an event in the DB
    new_event = Event(message="Simulated detection cycle complete. No dust plumes identified.", type="info")
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Detection cycle logged.'})

@app.route('/api/simulate/dust', methods=['POST'])
def simulate_dust():
    new_event = Event(message="CRITICAL: Dust plume detected at SITE_WF_001!", type="alert")
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Dust event triggered.'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
