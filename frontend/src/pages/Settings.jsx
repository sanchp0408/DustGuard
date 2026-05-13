import React, { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, Plus, User, Shield, MapPin, 
    Database, Server, Bell, Zap, Sliders, CheckCircle2, 
    AlertCircle, Wifi, Cpu, Globe
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Settings = () => {
    const [sites, setSites] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [predictiveMode, setPredictiveMode] = useState(true);
    const [notifications, setNotifications] = useState({ email: true, sms: false, push: true });
    const [systemHealth, setSystemHealth] = useState({ backend: 'online', ai_engine: 'ready', socket: 'connected' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sitesRes, usersRes] = await Promise.all([
                fetch(`${API}/api/sites`),
                fetch(`${API}/api/users`)
            ]);
            setSites(await sitesRes.json());
            setUsers(await usersRes.json());
            setLoading(false);
        } catch (err) {
            console.error("Settings fetch failed", err);
            setSystemHealth(prev => ({ ...prev, backend: 'offline' }));
        }
    };

    const updateThreshold = async (siteId, val) => {
        setSites(prev => prev.map(s => s.id === siteId ? { ...s, pm_threshold: val } : s));
        try {
            await fetch(`${API}/api/zones/${siteId}/threshold`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threshold: val })
            });
        } catch (err) { console.error("Threshold update failed", err); }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4">
                        <SettingsIcon size={40} className="text-primary" /> Command Center Configuration
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage infrastructure nodes, AI protocols, and regulatory thresholds.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Site & AI Thresholds */}
                <div className="lg:col-span-2 space-y-10">
                    <section className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                                <Sliders size={24} className="text-primary" /> Regulatory Thresholds
                            </h2>
                            <div className="flex items-center gap-3 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
                                <Zap size={16} className={predictiveMode ? 'text-primary' : 'text-slate-400'} />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-600">Predictive Trigger</span>
                                <button 
                                    onClick={() => setPredictiveMode(!predictiveMode)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${predictiveMode ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${predictiveMode ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {sites.map(site => (
                                <div key={site.id} className="group">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800">{site.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{site.location}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-primary">{site.pm_threshold}</span>
                                            <span className="text-xs font-bold text-slate-400 ml-1">μg/m³</span>
                                        </div>
                                    </div>
                                    <div className="relative h-2 bg-slate-100 rounded-full">
                                        <input 
                                            type="range" min="30" max="150" 
                                            value={site.pm_threshold} 
                                            onChange={(e) => updateThreshold(site.id, parseInt(e.target.value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: `${((site.pm_threshold - 30) / (150 - 30)) * 100}%` }} />
                                        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-4 border-primary rounded-full shadow-lg transition-all" style={{ left: `calc(${((site.pm_threshold - 30) / (150 - 30)) * 100}% - 12px)` }} />
                                    </div>
                                    <div className="flex justify-between mt-4 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                        <span>Sensitive (30)</span>
                                        <span>Bengaluru Baseline (60)</span>
                                        <span>Industrial (150)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                                <Bell size={24} className="text-primary" /> Alert Protocols
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <NotificationToggle label="Email Dispatch" active={notifications.email} onClick={() => setNotifications(n => ({...n, email: !n.email}))} />
                            <NotificationToggle label="SMS Emergency" active={notifications.sms} onClick={() => setNotifications(n => ({...n, sms: !n.sms}))} />
                            <NotificationToggle label="Browser Push" active={notifications.push} onClick={() => setNotifications(n => ({...n, push: !n.push}))} />
                        </div>
                    </section>
                </div>

                {/* System Health & Users */}
                <div className="space-y-10">
                    <section className="bg-dark p-10 rounded-[48px] text-white shadow-2xl shadow-slate-200">
                        <h2 className="text-xl font-black mb-10 flex items-center gap-3"><Server className="text-primary" /> Engine Vitality</h2>
                        <div className="space-y-8">
                            <HealthStatus label="Primary Backend" status={systemHealth.backend} icon={<Globe size={16} />} />
                            <HealthStatus label="Vision Inference Node" status={systemHealth.ai_engine} icon={<Cpu size={16} />} />
                            <HealthStatus label="Real-time Socket" status={systemHealth.socket} icon={<Wifi size={16} />} />
                        </div>
                    </section>

                    <section className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><User size={20} className="text-primary" /> Administrators</h2>
                            <button className="w-8 h-8 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Plus size={16} /></button>
                        </div>
                        <div className="space-y-6">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-800">{user.email.split('@')[0]}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

const HealthStatus = ({ label, status, icon }) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 text-slate-400">
            {icon}
            <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${status === 'online' || status === 'ready' || status === 'connected' ? 'text-emerald-500' : 'text-danger'}`}>{status}</span>
            <div className={`w-2 h-2 rounded-full ${status === 'online' || status === 'ready' || status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-danger'}`} />
        </div>
    </div>
);

const NotificationToggle = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`p-6 rounded-[32px] border-2 transition-all text-left group ${active ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' : 'bg-white border-slate-100'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-all ${active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
            {active ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-primary' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-xs font-bold mt-1 ${active ? 'text-slate-800' : 'text-slate-300'}`}>{active ? 'Enabled' : 'Disabled'}</p>
    </button>
);

export default Settings;
