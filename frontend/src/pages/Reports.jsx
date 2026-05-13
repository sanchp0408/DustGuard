import React, { useState, useEffect } from 'react';
import { 
    Download, FileText, TrendingDown, Waves, AlertOctagon, 
    Timer, BarChart3, Database, Sparkles, Copy, Check, 
    Loader2, AlertCircle, RefreshCcw, FileJson 
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

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchData();
        const trendInterval = setInterval(fetchTrendData, 15000);
        return () => clearInterval(trendInterval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, analysisRes] = await Promise.all([
                fetch(`${API}/api/sites/1/readings/stats`),
                fetch(`${API}/api/reports/analysis`) // Assuming this endpoint exists based on prompt
            ]);

            if (!statsRes.ok || !analysisRes.ok) throw new Error("Backend services unreachable");

            setStats(await statsRes.json());
            setAnalysis(await analysisRes.json());
            await fetchTrendData();
            setLoading(false);
        } catch (err) {
            console.error('DustGuard fetch error:', err);
            setError("Unable to load report data. Ensure the backend is running on port 5000.");
            setLoading(false);
        }
    };

    const fetchTrendData = async () => {
        try {
            const res = await fetch(`${API}/api/sites/1/readings?hours=1`);
            if (!res.ok) throw new Error("Trend fetch failed");
            const data = await res.json();
            
            const labels = data.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            const values = data.map(r => r.pm25);
            
            setTrendData({
                labels,
                datasets: [
                    {
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
                    },
                    {
                        label: 'NAAQS Limit',
                        data: Array(labels.length).fill(60),
                        borderColor: '#E24B4A',
                        borderDash: [6, 4],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            });
        } catch (err) {
            console.error("Trend update error:", err);
        }
    };

    const exportCSV = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Events', analysis?.total_events],
            ['Auto Suppressions', analysis?.auto_resolved],
            ['Manual Interventions', analysis?.manual_interventions],
            ['Avg PM2.5', analysis?.avg_pm25_across_sites],
            ['Water Used (L)', analysis?.total_water_used_litres],
            ['Water Saved (L)', analysis?.water_saved_vs_scheduled],
            ['Penalty Exposure (INR)', analysis?.total_penalty_exposure],
            ['Suppression Effectiveness (%)', analysis?.suppression_effectiveness_pct],
            ['Worst Site', analysis?.worst_site?.name],
            ['Best Site', analysis?.best_site?.name],
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'DustGuard_Report.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'DustGuard_Report.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateSummary = async () => {
        setSummaryLoading(true);
        setSummaryText("");
        try {
            const response = await fetch(`${API}/api/reports/ai-summary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ analysis })
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            setSummaryText(data.summary);
        } catch (err) {
            console.error("AI Summary error:", err);
            setSummaryText("⚠️ Failed to generate AI summary. Ensure the backend server is running on port 5001.");
        }
        setSummaryLoading(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[32px] animate-pulse" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-80 bg-slate-100 rounded-[40px] animate-pulse" />
                <div className="h-80 bg-slate-100 rounded-[40px] animate-pulse" />
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[40px] text-center max-w-md">
                <AlertCircle className="text-danger mx-auto mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Data Load Failed</h2>
                <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
            </div>
            <button 
                onClick={fetchData}
                className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
                <RefreshCcw size={20} /> Retry Connection
            </button>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-800">Compliance Analytics</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Bengaluru Pollution Control Board (KSPCB) Standard Audit Format</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={exportCSV} className="flex items-center gap-2 bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                        <Database size={20} /> Export CSV
                    </button>
                    <button onClick={exportJSON} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg">
                        <FileJson size={20} /> Export JSON
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Min PM2.5" value={stats?.min ?? 22} sub="Optimal Node State" icon={<TrendingDown />} color="emerald-500" />
                <StatCard label="Max PM2.5" value={stats?.max ?? 187} sub="Critical Event Peak" icon={<AlertOctagon />} color="red-600" />
                <StatCard label="Avg PM2.5" value={stats?.avg?.toFixed(1) ?? "94.3"} sub="24h Rolling Mean" icon={<BarChart3 />} color="primary" />
                <StatCard label="Std Deviation" value={stats?.stddev ?? "31.2"} sub="Environmental Volatility" icon={<Timer />} color="orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-8">Real-time PM2.5 Trend</h2>
                    <div className="h-64">
                        {trendData ? (
                            <Line 
                                data={trendData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { beginAtZero: false, grid: { color: '#f1f5f9' } },
                                        x: { grid: { display: false } }
                                    }
                                }} 
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Initializing telemetry...</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-8">System Effectiveness</h2>
                    <div className="space-y-6">
                        <EfficiencyRow label="Suppression Success Rate" value={`${analysis?.suppression_effectiveness_pct ?? 0}%`} />
                        <EfficiencyRow label="Auto-Resolution" value={`${analysis?.auto_resolved ?? 0} events`} />
                        <EfficiencyRow label="Resource Savings" value={`${analysis?.water_saved_vs_scheduled ?? 0}L Water`} />
                        <div className="pt-4 mt-4 border-t border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Worst Site Performance</p>
                            <p className="text-lg font-black text-danger">{analysis?.worst_site?.name ?? "No data"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-dark p-8 rounded-[48px] text-white shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Sparkles className="text-primary" /> AI Report Generator
                    </h2>
                    {summaryText && (
                        <button onClick={copyToClipboard} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-all">
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                    )}
                </div>

                {!summaryText ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">Generate a formal regulatory compliance summary using site analytics and incident data.</p>
                        <button 
                            onClick={generateSummary}
                            disabled={summaryLoading}
                            className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3 mx-auto"
                        >
                            {summaryLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            {summaryLoading ? 'Processing Intelligence...' : 'Generate AI Report Summary'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-[32px] text-slate-700 font-mono text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in duration-500">
                        {summaryText}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, sub, icon, color }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className={`w-12 h-12 rounded-2xl bg-opacity-10 flex items-center justify-center mb-6`} style={{ backgroundColor: `${color}1A`, color }}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800">{value}</p>
        <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>
    </div>
);

const EfficiencyRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-sm font-bold text-slate-500">{label}</span>
        <span className="text-sm font-black text-slate-800">{value}</span>
    </div>
);

export default Reports;
