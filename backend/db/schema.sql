-- DustGuard AI - Database Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'contractor' -- 'admin', 'contractor'
);

-- Contractors
CREATE TABLE IF NOT EXISTS contractors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 100,
    total_violations INTEGER DEFAULT 0,
    penalties_avoided REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Construction sites
CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    contractor_id INTEGER,
    lat REAL,
    lng REAL,
    pm_threshold REAL DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contractor_id) REFERENCES contractors(id)
);

-- Suppression zones per site
CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 0,
    pm_threshold REAL DEFAULT 60,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Real-time sensor readings
CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    pm25 REAL,
    pm10 REAL,
    humidity REAL,
    temperature REAL,
    wind_speed REAL DEFAULT 0,
    aqi INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Weather snapshots per site
CREATE TABLE IF NOT EXISTS weather_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    temp REAL, 
    humidity REAL, 
    wind_speed REAL,
    wind_direction TEXT, 
    condition TEXT,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Dust events log
CREATE TABLE IF NOT EXISTS dust_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    pm25_at_detection REAL,
    pm10_at_detection REAL,
    confidence_score REAL,
    detection_method TEXT, -- 'sensor', 'ai_vision'
    triggered_suppression BOOLEAN DEFAULT 0,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- AI detection logs from image uploads
CREATE TABLE IF NOT EXISTS ai_detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    image_name TEXT,
    objects_detected TEXT, -- JSON array
    dust_risk_level TEXT,  -- 'Low', 'Medium', 'High', 'Critical'
    confidence_avg REAL,
    pm25_at_time REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Suppression activity logs
CREATE TABLE IF NOT EXISTS suppression_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    zone_id INTEGER,
    duration_seconds INTEGER,
    litres_used REAL,
    triggered_by TEXT, -- 'auto', 'manual'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- Alerts and notifications log
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    alert_type TEXT,  -- 'PM_BREACH', 'EQUIPMENT_DETECTED', 'SUPPRESSION_FAIL', 'MANUAL_OVERRIDE'
    severity TEXT,    -- 'info', 'warning', 'critical'
    message TEXT,
    acknowledged BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Predictive model outputs
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    predicted_pm25 REAL,
    predicted_at DATETIME,
    horizon_minutes INTEGER,
    model_version TEXT DEFAULT 'v1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Contractor violations & performance
CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    contractor_id INTEGER,
    type TEXT,
    penalty_amount REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (contractor_id) REFERENCES contractors(id)
);
