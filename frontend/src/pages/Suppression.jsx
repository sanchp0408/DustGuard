import React, { useState, useEffect } from 'react';
import { 
    Power, Droplets, Info, Sparkles, Timer, 
    Waves, Loader2, Calendar, Zap, AlertTriangle, 
    Activity, Clock, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Suppression = () => {
    const socket = useSocket();
    const [sites, setSites] = useState([]);
    const [selectedSite, setSelectedSite] = useState(null);
    const [zones, setZones] = useState([]);
    const [waterToday, setWaterToday] = useState(0);
    const [loading, setLoading] = useState(true);
    const [zonesLoading, setZonesLoading] = useState(false);
    const [flashingZone, setFlashingZone] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchSites();
        fetchRecentEvents();
        const interval = setInterval(fetchRecentEvents, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedSite) fetchZones(selectedSite.id);
    }, [selectedSite]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('suppression_fired', (data) => {
            if (data.site_id === selectedSite?.id) {
                setFlashingZone(data.zone_id);
                setWaterToday(prev => prev + (data.litres || 15.5));
                setTimeout(() => setFlashingZone(null), 3000);
                fetchRecentEvents();
                setToast({ type: 'success', msg: `Autonomous suppression fired in Zone ${data.zone_id}` });
            }
        });

        return () => socket.off('suppression_fired');
    }, [socket, selectedSite]);

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const fetchSites = async () => {
        try {
            const res = await fetch(`${API}/api/sites`);
            if (!res.ok) throw new Error("Sites fetch failed");
            const data = await res.json();
            setSites(data);
            if (data.length > 0) setSelectedSite(data[0]);
            setLoading(false);
        } catch (err) {
            console.error('DustGuard fetch error:', err);
            setToast({ type: 'error', msg: 'Failed to load sites' });
            setLoading(false);
        }
    };

    const fetchZones = async (id) => {
        setZonesLoading(true);
        try {
            const res = await fetch(`${API}/api/sites/${id}/zones`);
            if (!res.ok) throw new Error("Zones fetch failed");
            const data = await res.json();
            setZones(data);
        } catch (err) {
            console.error('DustGuard zones error:', err);
            setToast({ type: 'error', msg: 'Failed to load suppression zones' });
        }
        setZonesLoading(false);
    };

    const fetchRecentEvents = async () => {
        try {
            const res = await fetch(`${API}/api/events/recent?limit=5`);
            if (res.ok) {
                const data = await res.json();
                setRecentEvents(data);
            }
        } catch (err) {
            console.error("Event log error:", err);
        }
    };

    const toggleZone = async (zoneId, currentState) => {
        try {
            const res = await fetch(`${API}/api/zones/${zoneId}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentState })
            });
            if (!res.ok) throw new Error("Toggle failed");
            
            setZones(prev => prev.map(z => z.id === zoneId ? { ...z, is_active: !currentState, last_triggered: !currentState ? new Date().toISOString() : z.last_triggered } : z));
            setToast({ type: 'success', msg: `Zone ${currentState ? 'deactivated' : 'activated'} successfully` });
        } catch (err) {
            console.error("Toggle error:", err);
            setToast({ type: 'error', msg: 'Manual override failed. Check backend.' });
        }
    };

    const toggleAll = async (active) => {
        try {
            await Promise.all(zones.map(z => 
                fetch(`${API}/api/zones/${z.id}/toggle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active })
                })
            ));
            setZones(prev => prev.map(z => ({ ...z, is_active: active, last_triggered: active ? new Date().toISOString() : z.last_triggered })));
            setToast({ type: 'success', msg: `All zones ${active ? 'activated' : 'deactivated'}` });
        } catch (err) {
            setToast({ type: 'error', msg: 'Global command failed' });
        }
    };

    const relativeTime = (dt) => {
        if (!dt) return 'Never triggered';
        const diff = Math.floor((Date.now() - new Date(dt)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        return `${Math.floor(diff/3600)}h ago`;
    };

    if (loading) return <div className="flex items-center justify-center h-[60vh] font-black text-slate-400 animate-pulse uppercase tracking-[0.2em]">Synchronizing Suppression Matrix...</div>;

    return (
        <div className="space-y-10 animate-in slide-in-from-right duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800">Autonomous Suppression</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Bengaluru Edge-Node Sprinkler Control Hub</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex gap-2 p-1">
                        {sites.map(site => (
                            <button 
                                key={site.id}
                                onClick={() => setSelectedSite(site)}
                                className={`px-6 py-3 rounded-2xl text-xs font-black transition-all uppercase tracking-widest ${
                                    selectedSite?.id === site.id ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                                }`}
                            >
                                {site.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Droplets />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Usage Today</p>
                                    <p className="text-lg font-black text-slate-800">{waterToday.toFixed(1)} Litres</p>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-slate-100" />
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <Activity />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Active Misters</p>
                                    <p className="text-lg font-black text-slate-800">{zones.filter(z => z.is_active).length} / {zones.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => toggleAll(true)} className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">All On</button>
                            <button onClick={() => toggleAll(false)} className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">All Off</button>
                        </div>
                    </div>

                    {zonesLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-50 rounded-[40px] border border-slate-100" />)}
                        </div>
                    ) : zones.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-[40px] border border-slate-100 border-dashed">
                            <AlertTriangle className="mx-auto text-slate-200 mb-4" size={64} />
                            <h3 className="text-xl font-black text-slate-800">No Zones Configured</h3>
                            <p className="text-slate-400 mt-2">Seed the database to add suppression zones for {selectedSite?.name}.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {zones.map(zone => {
                                const isFlashing = flashingZone === zone.id;
                                return (
                                    <div 
                                        key={zone.id} 
                                        className={`bg-white p-8 rounded-[48px] border-2 transition-all duration-300 relative group overflow-hidden ${
                                            isFlashing ? 'ring-4 ring-emerald-400 bg-emerald-50 border-emerald-200 scale-[1.02]' : 
                                            zone.is_active ? 'border-primary ring-8 ring-primary/5' : 'border-slate-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-10">
                                            <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all ${
                                                zone.is_active ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-slate-50 text-slate-300'
                                            }`}>
                                                <Droplets size={28} />
                                            </div>
                                            <button 
                                                onClick={() => toggleZone(zone.id, zone.is_active)}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                    zone.is_active ? 'bg-danger text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                            >
                                                <Power size={20} />
                                            </button>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">{zone.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                                <Clock size={10} /> {relativeTime(zone.last_triggered)}
                                            </p>
                                        </div>

                                        {zone.is_active && (
                                            <div className="flex gap-1 mt-4">
                                                {[0,1,2].map(i => (
                                                    <div key={i} className="w-1.5 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-10 pt-6 border-t border-slate-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Trigger Risk</span>
                                                <span className="text-[10px] font-black text-slate-800">{zone.pm_threshold} μg</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${zone.is_active ? 'bg-primary' : 'bg-slate-200'}`} 
                                                    style={{ width: '60%' }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-dark p-8 rounded-[48px] text-white shadow-2xl flex flex-col h-[700px]">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock className="text-primary" size={24} />
                            <h2 className="text-xl font-black">Suppression Log</h2>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {recentEvents.map((e, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-right duration-500">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{new Date(e.timestamp || e.created_at).toLocaleTimeString()}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${e.triggered_by === 'manual' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                                            {e.triggered_by || 'Auto'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-200 truncate">{e.site_name || 'System Node'}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Zone Activated: Zone {e.zone_id || '???'}</p>
                                </div>
                            ))}
                            {recentEvents.length === 0 && <div className="text-center py-12 opacity-20"><Zap size={40} className="mx-auto mb-2" /><p className="text-xs font-bold uppercase">No Recent Pulses</p></div>}
                        </div>
                        <button className="mt-8 py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Audit Global Events</button>
                    </div>

                    <div className="bg-white p-8 rounded-[48px] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <ShieldAlert size={24} />
                            <h2 className="text-xl font-black text-slate-800">Protocol Status</h2>
                        </div>
                        <div className="space-y-4">
                            <ProtocolRow label="AI Predictive Mode" status="Active" active />
                            <ProtocolRow label="Manual Override" status="Ready" />
                            <ProtocolRow label="Sensor Mesh" status="Connected" active />
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-500 z-50 flex items-center gap-3 ${
                    toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-bold text-sm">{toast.msg}</span>
                </div>
            )}
        </div>
    );
};

const ProtocolRow = ({ label, status, active }) => (
    <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'text-emerald-500' : 'text-slate-300'}`}>{status}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-200'}`} />
        </div>
    </div>
);

export default Suppression;
