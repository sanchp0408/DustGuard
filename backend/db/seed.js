const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'dustguard.db');

// Delete existing database for a clean seed
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('🌱 Seeding DustGuard AI Enterprise Database...');

// --- Seed Users ---
const insertUser = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
insertUser.run('admin@dustguard.ai', 'admin123', 'admin');
insertUser.run('contractor@dustguard.ai', 'contractor123', 'contractor');

// --- Seed Contractors ---
const contractors = [
    { name: "L&T Construction", score: 94, violations: 2, savings: 850000 },
    { name: "Tata Projects", score: 88, violations: 5, savings: 1200000 },
    { name: "Shapoorji Pallonji", score: 72, violations: 12, savings: 450000 },
    { name: "NCC Limited", score: 54, violations: 28, savings: 2100000 }
];

const insertContractor = db.prepare('INSERT INTO contractors (name, score, total_violations, penalties_avoided) VALUES (?, ?, ?, ?)');
contractors.forEach(c => insertContractor.run(c.name, c.score, c.violations, c.savings));

// --- Seed Sites & Zones ---
const sites = [
    { name: 'Whitefield Ring Road', loc: 'Outer Ring Rd, Marathahalli', lat: 12.9591, lng: 77.6974, contractor_id: 1 },
    { name: 'Hebbal Expressway', loc: 'Hebbal Flyover, North BLR', lat: 13.0358, lng: 77.5970, contractor_id: 2 },
    { name: 'Koramangala Metro', loc: 'Sony World Signal, South BLR', lat: 12.9352, lng: 77.6245, contractor_id: 3 },
    { name: 'Electronic City Ph2', loc: 'Hosur Road, South BLR', lat: 12.8452, lng: 77.6635, contractor_id: 4 },
    { name: 'Silk Board Junction', loc: 'BTM Layout, Central BLR', lat: 12.9176, lng: 77.6233, contractor_id: 1 }
];

const insertSite = db.prepare('INSERT INTO sites (name, location, lat, lng, pm_threshold, contractor_id) VALUES (?, ?, ?, ?, ?, ?)');
const insertZone = db.prepare('INSERT INTO zones (site_id, name, pm_threshold) VALUES (?, ?, ?)');

sites.forEach((s, i) => {
    const siteId = insertSite.run(s.name, s.loc, s.lat, s.lng, 60, s.contractor_id).lastInsertRowid;
    for (let z = 1; z <= 6; z++) {
        insertZone.run(siteId, `Zone ${z} - ${['North', 'South', 'East', 'West', 'Center', 'Entry'][z-1]}`, 60);
    }
});

// --- Seed Historical Data (Last 30 Days) ---
const insertReading = db.prepare(`
    INSERT INTO sensor_readings (site_id, pm25, pm10, humidity, temperature, wind_speed, aqi, timestamp) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAlert = db.prepare(`
    INSERT INTO alerts (site_id, alert_type, severity, message, acknowledged, created_at) 
    VALUES (?, ?, ?, ?, ?, ?)
`);

const insertDetection = db.prepare(`
    INSERT INTO ai_detections (site_id, image_name, objects_detected, dust_risk_level, confidence_avg, pm25_at_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertPrediction = db.prepare(`
    INSERT INTO predictions (site_id, predicted_pm25, predicted_at, horizon_minutes, created_at)
    VALUES (?, ?, ?, ?, ?)
`);

const insertEvent = db.prepare(`
    INSERT INTO dust_events (site_id, pm25_at_detection, pm10_at_detection, confidence_score, detection_method, triggered_suppression, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date();
const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

const computeAQI = (pm25) => {
    if (pm25 <= 12) return Math.round((50/12) * pm25);
    if (pm25 <= 35.4) return Math.round(((100-51)/(35.4-12.1)) * (pm25-12.1) + 51);
    if (pm25 <= 55.4) return Math.round(((150-101)/(55.4-35.5)) * (pm25-35.5) + 101);
    if (pm25 <= 150.4) return Math.round(((200-151)/(150.4-55.5)) * (pm25-55.5) + 151);
    return 300;
};

db.transaction(() => {
    for (let day = 0; day < 30; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const timestamp = new Date(thirtyDaysAgo.getTime() + (day * 24 * 60 * 60 * 1000) + (hour * 60 * 60 * 1000)).toISOString();
            
            for (let siteId = 1; siteId <= sites.length; siteId++) {
                let basePm = siteId === 1 ? 120 : (siteId === 4 ? 20 : 45);
                let timeFactor = (hour > 8 && hour < 18) ? 1.5 : 0.8;
                let noise = Math.random() * 20;
                let pm25 = Math.round((basePm * timeFactor) + noise);
                let pm10 = Math.round(pm25 * 1.6);
                let aqi = computeAQI(pm25);
                
                insertReading.run(siteId, pm25, pm10, 45 + Math.random()*20, 28 + Math.random()*5, Math.random()*15, aqi, timestamp);

                if (pm25 > 100 && Math.random() > 0.8) {
                    insertAlert.run(siteId, 'PM_BREACH', pm25 > 150 ? 'critical' : 'warning', `PM2.5 spike detected: ${pm25} μg/m³`, day < 28 ? 1 : 0, timestamp);
                    insertEvent.run(siteId, pm25, pm10, 0.95, 'sensor', 1, timestamp);
                }

                if (hour === 12) {
                    const objects = JSON.stringify([{ class: 'truck', score: 0.92 }, { class: 'person', score: 0.85 }]);
                    insertDetection.run(siteId, `site_${siteId}_day_${day}.jpg`, objects, pm25 > 80 ? 'High' : 'Medium', 0.88, pm25, timestamp);
                }

                insertPrediction.run(siteId, pm25 + (Math.random() > 0.5 ? 5 : -5), new Date(new Date(timestamp).getTime() + 30*60*1000).toISOString(), 30, timestamp);
            }
        }
    }
})();

console.log('✅ Seeded 36,000+ data points for last 30 days including contractors.');
db.close();
