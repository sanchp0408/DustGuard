# 🛡️ DustGuard AI: Autonomous Environmental Protection System

DustGuard AI is an enterprise-grade, full-stack IoT and AI platform designed for real-time construction dust monitoring and autonomous suppression. Specifically engineered for the urban construction challenges of Bengaluru, India, the system follows a closed-loop philosophy: **DETECT → VERIFY → ACT**.

---

## 🏗️ System Architecture

### 💻 Frontend (The Command Center)
- **React 18 & Vite**: Lightning-fast UI with component-based architecture.
- **Tailwind CSS**: Custom "Aesthetic-Premium" design system with dark modes and glassmorphism.
- **Chart.js**: Real-time time-series visualizations for PM2.5 and PM10 telemetry.
- **Socket.io-Client**: Live websocket pipeline for instant sensor updates and suppression firing events.
- **Lucide Icons**: High-fidelity iconography for industrial controls.

### ⚙️ Backend (The Intelligence Hub)
- **Node.js & Express**: High-concurrency API server.
- **Socket.io**: Real-time event broadcasting server.
- **Better-SQLite3**: High-performance, synchronous local database engine.
- **Simulation Engine**: Robust climate simulation running every 10s to generate realistic site telemetry.

### 🧠 AI & Analytics Pipeline
- **Edge Vision**: TensorFlow.js (COCO-SSD) running directly in the browser for zero-latency object detection (trucks, excavators, workers).
- **LLM Reasoning**: Claude 3.5 Sonnet integration for multi-step environmental risk auditing and regulatory report synthesis.
- **Predictive Engine**: Linear trend-slope algorithm forecasting pollution breaches 30 minutes in advance.

---

## 🌟 Core Features

### 1. **Live Command Dashboard**
The central hub for fleet-wide monitoring.
- **AQI Gauges**: Real-time US-EPA standard AQI computation per site node.
- **Interactive Trends**: Multi-site PM2.5 line charts with dynamic segment coloring (Good/Warning/Hazardous).
- **Incident Banner**: Unacknowledged alert system with severity-coded priorities.
- **Predictive Notifications**: HUD indicators for forecasted threshold breaches.

### 2. **AI Vision & Detection**
Autonomous identification of dust-generating activities.
- **Camera Feed**: WebRTC-based live camera stream integration.
- **Object Tracking**: Real-time bounding boxes for construction equipment.
- **Claude Verification**: AI-driven analysis that cross-references vision data with sensor readings to determine suppression strategy.
- **Risk Scoring**: Categorization of events into Low, Medium, High, or Critical risk.

### 3. **Smart Suppression Control**
Precision water deployment to maximize conservation.
- **Zone Matrix**: Control up to 6 independent misting zones per site.
- **Water usage Tracking**: Real-time calculation of liters consumed vs. manual estimate savings.
- **Smart Scheduling**: AI-suggested misting windows based on humidity and wind speed trends.
- **Zone Flashing**: Visual feedback on the UI when a specific physical mister is activated.

### 4. **Compliance & Regulatory Reporting**
Automated paperwork for BBMP and KSPCB.
- **NAAQS Audit**: 24-hour rolling stats (Min/Max/Avg/StdDev) relative to Indian air quality standards.
- **AI Report Synthesizer**: One-click generation of formal monthly compliance summaries using Claude.
- **Data Export**: Support for full 30-day historical dumps in CSV and JSON formats.
- **Heatmap Visualization**: Hourly dispersion patterns across a 7-day window.

### 5. **Contractor Accountability**
The "Environmental Ledger" for site management.
- **Compliance Scoring**: Dynamic scores (0-100) based on response time and violation frequency.
- **Penalty Exposure**: Real-time calculation of estimated liability in INR (₹) based on CPCB standards.
- **Risk Audits**: Deep-dive AI audits for individual contractors to identify systemic site issues.

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Database Initialization
```bash
cd backend
npm install
node db/seed.js
```
*Note: The seed script generates 36,000+ data points covering 30 days of history for all 5 site nodes.*

### 2. Backend Start
```bash
# In the /backend directory
node server.js
```
The server will run on `http://localhost:5000`.

### 3. Frontend Start
```bash
cd frontend
npm install
# Create a .env file with: VITE_API_URL=http://localhost:5000
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/dashboard/summary` | GET | Aggregated fleet metrics |
| `/api/sites` | GET | Detailed status of all site nodes |
| `/api/sites/:id/readings` | GET | Time-series telemetry for charts |
| `/api/reports/analysis` | GET | 30-day compliance data crunch |
| `/api/contractors` | GET | Ranked accountability ledger |
| `/api/zones/:id/toggle` | POST | Manual mister override |

---
*Built for Bengaluru's Clean Air Initiative 2026. DustGuard AI: Protecting the environment through autonomous intelligence.*
