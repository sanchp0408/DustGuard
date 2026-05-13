// --- State ---
let charts = {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initial data fetch
    fetchDashboardData();
    fetchEvents();
    fetchContractors();
    fetchZones('BLR-MH-092');
    
    initCharts();

    // Auto-refresh every 5 seconds for live feel
    setInterval(() => {
        fetchDashboardData();
        fetchEvents();
    }, 5000);
});

// --- API Calls ---
async function fetchDashboardData() {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    
    // Update Stats
    document.getElementById('stat-active-sites').innerText = data.stats.active_sites;
    document.getElementById('stat-avg-pm').innerText = data.stats.avg_pm25;
    document.getElementById('stat-suppressions').innerText = data.stats.suppressions_today;
    document.getElementById('stat-violations').innerText = data.stats.violations_blocked;

    // Update Site List
    const container = document.getElementById('site-status-list');
    container.innerHTML = data.sites.map(site => `
        <div class="site-item">
            <div class="site-status-dot dot-${site.status}"></div>
            <div class="site-info">
                <div class="site-name">${site.name}</div>
                <div class="site-id">${site.id}</div>
            </div>
            <div class="site-reading">
                <span class="reading-value">${site.pm}</span>
                <span class="reading-unit">μg/m³</span>
            </div>
        </div>
    `).join('');
}

async function fetchEvents() {
    const res = await fetch('/api/events');
    const data = await res.json();
    const log = document.getElementById('event-log');
    
    log.innerHTML = data.map(e => {
        let icon = 'info-circle';
        let color = 'var(--info)';
        let bg = 'transparent';

        if (e.type === 'alert') {
            icon = 'alert-triangle'; color = 'var(--danger)'; bg = '#FFF1F2';
        } else if (e.type === 'ok') {
            icon = 'circle-check'; color = 'var(--primary)'; bg = '#F0FDF4';
        }

        return `
            <div style="padding: 12px 24px; border-bottom: 0.5px solid var(--border); font-size: 0.85rem; background: ${bg};">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <i class="ti ti-${icon}" style="color: ${color}"></i>
                    <span style="color: var(--text-muted); font-size: 0.75rem;">${e.timestamp}</span>
                    <span style="font-weight: 500;">${e.message}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function fetchZones(siteId) {
    const res = await fetch(`/api/zones/${siteId}`);
    const data = await res.json();
    const container = document.getElementById('zone-container');
    
    container.innerHTML = data.map(z => `
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 16px; margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 700;">Zone ${z.name}</div>
                <label class="switch">
                    <input type="checkbox" ${z.is_active ? 'checked' : ''} onchange="toggleZone(${z.id}, this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Current PM:</span>
                <span style="font-weight: 700;">${z.pm} μg/m³</span>
            </div>
            <div style="font-size: 0.75rem; color: ${z.is_active ? 'var(--primary)' : 'var(--text-muted)'}; font-weight: 600;">
                ${z.is_active ? '<i class="ti ti-droplet-filled"></i> Suppressing...' : '<i class="ti ti-circle-x"></i> Idle'}
            </div>
        </div>
    `).join('');
}

async function toggleZone(id, active) {
    await fetch('/api/zones/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active })
    });
    fetchZones('BLR-MH-092');
}

async function fetchContractors() {
    const res = await fetch('/api/contractors');
    const data = await res.json();
    const container = document.getElementById('contractor-list');
    
    container.innerHTML = data.map(c => `
        <div style="background: #fff; padding: 16px; border-radius: 8px; border: 0.5px solid var(--border); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 700;">${c.name}</span>
                <span class="badge" style="background: ${c.score > 80 ? '#DCFCE7' : '#FEF3C7'}; color: ${c.score > 80 ? '#166534' : '#92400E'}; padding: 4px 10px; border-radius: 99px; font-size: 0.75rem;">${c.status}</span>
            </div>
            <div style="margin-bottom: 8px; font-size: 0.85rem; display: flex; justify-content: space-between;">
                <span>Compliance Score</span>
                <span style="font-weight: 700; color: ${c.color}">${c.score}%</span>
            </div>
            <div class="progress-bg">
                <div class="progress-fill" style="width: ${c.score}%; background: ${c.color}"></div>
            </div>
        </div>
    `).join('');
}

// --- Simulations ---
async function runDetectionCycle() {
    addDecisionLog("Initializing Detection Cycle...", "info");
    let confidence = 0;
    const interval = setInterval(() => {
        confidence += 5;
        if (confidence >= 100) {
            clearInterval(interval);
            completeCycle();
        }
        document.getElementById('confidence-bar').style.width = confidence + '%';
        document.getElementById('confidence-val').innerText = confidence + '%';
    }, 100);

    async function completeCycle() {
        await fetch('/api/simulate/detection', { method: 'POST' });
        addDecisionLog("Scan Complete. Results synced with cloud.", "ok");
        fetchEvents();
    }
}

async function simulateDustEvent() {
    await fetch('/api/simulate/dust', { method: 'POST' });
    document.getElementById('dust-box').style.display = 'block';
    addDecisionLog("CRITICAL: Dust plume detected!", "alert");
    
    setTimeout(() => {
        document.getElementById('dust-box').style.display = 'none';
        addDecisionLog("Resolved: Suppression active.", "ok");
        fetchEvents();
    }, 3000);
}

// --- Utils ---
function updateClock() {
    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString('en-GB');
}

function switchTab(tabId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${tabId}-section`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.innerText.toLowerCase().includes(tabId)) item.classList.add('active');
    });
}

function addDecisionLog(msg, type) {
    const log = document.getElementById('decision-log');
    const div = document.createElement('div');
    div.innerHTML = `<span style="color: #64748B;">[${new Date().toLocaleTimeString()}]</span> <span style="color: ${type === 'alert' ? 'var(--danger)' : type === 'ok' ? 'var(--primary)' : 'var(--info)'}">${msg}</span>`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

function initCharts() {
    // Re-use chart logic from before but target IDs
    const ctx = document.getElementById('pmTrendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            datasets: [{ label: 'Whitefield', data: [110, 145, 120, 160, 130, 124], borderColor: '#E24B4A', tension: 0.4 }]
        }
    });
    // Add other charts as needed...
}
