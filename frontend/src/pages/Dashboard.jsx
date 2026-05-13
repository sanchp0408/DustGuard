import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../hooks/useSocket';
import { 
    Activity, Wind, Droplet, ShieldAlert, Clock, AlertTriangle, 
    Info, ChevronRight, Zap, Bell, CheckCircle2, TrendingUp
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, 
    Title, Tooltip, Legend, Filler
);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
    const socket = useSocket();
    const [summary, setSummary] = useState({ activeSites: 0, avgPM25: 0, suppressionsToday: 0, violationsBlocked: 0 });
    const [sites, setSites] = useState([]);
    const [events, setEvents] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [trendData, setTrendData] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        const dataTimer = setInterval(() => {
            fetchDashboard();
            fetchSites();
            fetchTrend();
            fetchPrediction();
        }, 10000);

        fetchDashboard();
        fetchSites();
        fetchEvents();
        fetchAlerts();
        fetchTrend();
        fetchPrediction();

        return () => {
            clearInterval(timer);
            clearInterval(dataTimer);
        };
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('sensor_update', (data) => {
            setSites(prev => prev.map(s => s.id === data.site_id ? { ...s, pm25: data.pm25, aqi: data.aqi } : s));
        });
        socket.on('new_alert', (alert) => {
            setAlerts(prev => [alert, ...prev]);
            setEvents(prev => [{ ...alert, type: 'alert', created_at: new Date().toISOString() }, ...prev].slice(0, 20));
        });
    }, [socket]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`${API}/api/dashboard/summary`);
            setSummary(await res.json());
        } catch (err) { console.error("Summary fetch failed", err); }
    };

    const fetchSites = async () => {
        try {
            const res = await fetch(`${API}/api/sites`);
            setSites(await res.json());
        } catch (err) { console.error("Sites fetch failed", err); }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API}/api/events/recent`);
            setEvents(await res.json());
        } catch (err) { console.error("Events fetch failed", err); }
    };

    const fetchAlerts = async () => {
        try {
            const res = await fetch(`${API}/api/alerts?acknowledged=false`);
            setAlerts(await res.json());
        } catch (err) { console.error("Alerts fetch failed", err); }
    };

    const fetchTrend = async () => {
        try {
            const res = await fetch(`${API}/api/sites/1/readings?hours=1`);
            const data = await res.json();
            const labels = data.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            const values = data.map(r => r.pm25);
            setTrendData({
                labels,
                datasets: [{
                    label: 'PM2.5 Level',
                    data: values,
                    borderColor: '#1D9E75',
                    backgroundColor: 'rgba(29, 158, 117, 0.1)',
                    fill: true,
                    tension: 0.4,
                    segment: {
                        borderColor: ctx => {
                            const val = ctx.p1.raw;
                            if (val > 120) return '#E24B4A';
                            if (val > 60) return '#F59E0B';
                            return '#1D9E75';
                        }
                    }
                }]
            });
        } catch (err) { console.error("Trend fetch failed", err); }
    };

    const fetchPrediction = async () => {
        try {
            const res = await fetch(`${API}/api/predictions/1`);
            const data = await res.json();
            if (data.length > 0) setPrediction(data[data.length - 1]);
        } catch (err) { console.error("Prediction fetch failed", err); }
    };

    const getAQICategory = (pm25) => {
        if (pm25 <= 30) return { label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-500' };
        if (pm25 <= 60) return { label: 'Moderate', color: 'bg-yellow-500', text: 'text-yellow-500' };
        if (pm25 <= 120) return { label: 'Unhealthy', color: 'bg-orange-500', text: 'text-orange-500' };
        return { label: 'Hazardous', color: 'bg-red-600', text: 'text-red-600' };
    };

    const avgAQI = getAQICategory(summary.avgPM25);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Unacknowledged Alerts Banner */}
            {alerts.length > 0 && (
                <div className="bg-danger p-4 rounded-2xl text-white flex justify-between items-center animate-bounce shadow-lg shadow-danger/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} />
                        <span className="font-bold">⚠️ {alerts.length} unacknowledged critical alerts require immediate action</span>
                    </div>
                    <button onClick={() => setAlerts([])} className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-xs font-bold transition-all">Dismiss</button>
                </div>
            )}

            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800">Environmental Command</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Bengaluru Central Monitoring Hub • Real-time Suppression Intelligence</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="bg-slate-100 p-3 rounded-2xl">
                        <Clock className="text-slate-500" size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Node Sync Time</p>
                        <p className="text-lg font-mono font-bold text-slate-700">{clock.toLocaleTimeString('en-GB')}</p>
                    </div>
                </div>
            </header>

            {/* Predictive Alert */}
            {prediction && prediction.predicted_pm25 > 60 && (
                <div className="bg-warning/10 border-2 border-warning/20 p-6 rounded-[32px] flex items-center justify-between animate-in zoom-in duration-500">
                    <div className="flex items-center gap-6">
                        <div className="bg-warning text-white p-4 rounded-2xl shadow-lg shadow-warning/20">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-warning font-black text-xl">Predictive Breach Warning</h3>
                            <p className="text-warning/80 font-medium">PM2.5 forecast to reach <span className="font-bold">{prediction.predicted_pm25} μg/m³</span> in the next {prediction.horizon_minutes} minutes.</p>
                        </div>
                    </div>
                    <button className="bg-warning text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-warning/20">Pre-emptively Suppress</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Active Site Nodes" value={summary.activeSites} icon={<Activity />} color="primary" trend="+2 this week" />
                
                {/* AQI Custom Card */}
                <div className={`p-6 rounded-[32px] shadow-sm border border-slate-100 transition-all ${avgAQI.color} text-white`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <Wind size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">{avgAQI.label}</span>
                    </div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Avg PM2.5 (μg/m³)</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black">{summary.avgPM25}</p>
                        <p className="text-xs font-bold opacity-60">Bengaluru Avg</p>
                    </div>
                </div>

                <MetricCard title="Suppressions Today" value={summary.suppressionsToday} icon={<Droplet />} color="primary" trend="Optimized via AI" />
                <MetricCard title="Compliance Failures Blocked" value={summary.violationsBlocked} icon={<ShieldAlert />} color="danger" trend="₹1.2 Cr Saved" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Live Trend Chart */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                                    <TrendingUp className="text-primary" size={24} /> Site Node PM2.5 Flux
                                </h2>
                                <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-widest">Live 1-Hour Analytics Window</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-400">GOOD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-warning" />
                                    <span className="text-[10px] font-bold text-slate-400">UNHEALTHY</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-80 relative z-10">
                            {trendData && (
                                <Line 
                                    data={trendData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
                                            x: { grid: { display: false }, border: { display: false } }
                                        },
                                        interaction: { intersect: false, mode: 'index' }
                                    }} 
                                />
                            )}
                        </div>
                        {/* NAAQS Annotation Line Fake Overlay */}
                        <div className="absolute left-[72px] right-8 border-t-2 border-dashed border-danger/40 z-0 opacity-50" style={{ top: '68%' }}>
                            <span className="absolute -top-6 right-0 text-[8px] font-black text-danger uppercase tracking-widest">NAAQS Limit (60 μg/m³)</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">Live Site Matrix</h2>
                            <button className="flex items-center gap-2 text-primary font-bold hover:underline text-sm uppercase tracking-widest">
                                Global Map View <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-slate-400 font-bold tracking-widest border-b border-slate-50">
                                        <th className="pb-6 px-4">Infrastructure Node</th>
                                        <th className="pb-6">AQI Index</th>
                                        <th className="pb-6">PM2.5</th>
                                        <th className="pb-6">Status Protocol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sites.map(site => {
                                        const siteAQI = getAQICategory(site.pm25);
                                        return (
                                            <tr key={site.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="py-6 px-4">
                                                    <div className="font-bold text-slate-800 text-lg">{site.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{site.location}</div>
                                                </td>
                                                <td className="py-6">
                                                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${siteAQI.color} text-white`}>
                                                        {siteAQI.label}
                                                    </div>
                                                </td>
                                                <td className="py-6 font-mono font-black text-xl text-slate-700">{site.pm25 || '--'}</td>
                                                <td className="py-6">
                                                    <div className={`flex items-center gap-2 font-bold ${site.pm25 > 60 ? 'text-danger' : 'text-primary'}`}>
                                                        {site.pm25 > 60 ? <AlertTriangle size={16} className="animate-pulse" /> : <CheckCircle2 size={16} />}
                                                        {site.pm25 > 120 ? 'CRITICAL BREACH' : site.pm25 > 60 ? 'AUTO-SUPPRESSING' : 'SECURE'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-dark p-8 rounded-[40px] text-white shadow-2xl shadow-slate-200 flex flex-col h-[850px]">
                        <div className="flex items-center gap-3 mb-8">
                            <Bell className="text-primary animate-swing" size={24} />
                            <h2 className="text-2xl font-black">Intelligence Feed</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {events.map((e, i) => (
                                <div key={i} className={`p-6 rounded-3xl border animate-in slide-in-from-right duration-500 delay-${i*100} ${
                                    e.severity === 'critical' ? 'bg-danger/10 border-danger/20' : 
                                    e.severity === 'warning' ? 'bg-warning/10 border-warning/20' : 
                                    'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-2xl h-fit ${
                                            e.severity === 'critical' ? 'bg-danger text-white' : 
                                            e.severity === 'warning' ? 'bg-warning text-white' : 
                                            'bg-primary text-white'
                                        }`}>
                                            {e.severity === 'critical' ? <ShieldAlert size={20} /> : <Info size={20} />}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                {new Date(e.created_at).toLocaleTimeString()} • {e.site_name}
                                            </div>
                                            <p className="text-sm font-bold mt-2 leading-relaxed">
                                                {e.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all text-xs uppercase tracking-widest text-slate-400">View Full Incident Audit</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-3xl bg-${color}/10 text-${color} group-hover:scale-110 transition-transform`}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter">{trend}</span>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <p className="text-4xl font-black text-slate-800">{value}</p>
    </div>
);

export default Dashboard;
