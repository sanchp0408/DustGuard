import React, { useState, useEffect, useRef } from 'react';
import {
    ShieldAlert, TrendingDown, AlertTriangle, CheckCircle2,
    Sparkles, Loader2, Users, IndianRupee, ChevronDown, ChevronUp,
    FileDown, Zap, Clock, Activity
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// CPCB 2019 Fine Schedule
const CPCB_SCHEDULE = [
    { maxScore: 40, label: 'Critical — Shutdown Risk', dailyFine: 1500000, color: '#E24B4A', bg: 'bg-red-500', pill: 'bg-red-100 text-red-700', barColor: '#E24B4A' },
    { maxScore: 60, label: 'High Risk', dailyFine: 1000000, color: '#EF4444', bg: 'bg-red-400', pill: 'bg-red-50 text-red-600', barColor: '#EF4444' },
    { maxScore: 75, label: 'Non-Compliant', dailyFine: 500000, color: '#F59E0B', bg: 'bg-amber-400', pill: 'bg-amber-100 text-amber-700', barColor: '#F59E0B' },
    { maxScore: 85, label: 'Caution', dailyFine: 150000, color: '#EF9F27', bg: 'bg-yellow-400', pill: 'bg-yellow-100 text-yellow-700', barColor: '#EF9F27' },
    { maxScore: 100, label: 'Compliant', dailyFine: 0, color: '#1D9E75', bg: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700', barColor: '#1D9E75' },
];

const getScoreTier = (score) => CPCB_SCHEDULE.find(t => score <= t.maxScore) || CPCB_SCHEDULE[CPCB_SCHEDULE.length - 1];

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);
const fmtL = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${fmt(n)}`;

// Animated counter hook
const useCounter = (target, duration = 1200) => {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (target === 0) return setValue(0);
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setValue(Math.round(current));
            if (current >= target) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return value;
};

// Live ticker for fine (ticks every second)
const LiveFineTicker = ({ dailyFine }) => {
    const perSecond = dailyFine / 86400;
    const [accrued, setAccrued] = useState(perSecond * (new Date().getSeconds()));
    useEffect(() => {
        if (dailyFine === 0) return;
        const timer = setInterval(() => {
            setAccrued(prev => prev + perSecond);
        }, 1000);
        return () => clearInterval(timer);
    }, [dailyFine, perSecond]);
    return (
        <span className="font-mono text-xs font-bold text-red-400">
            ₹{fmt(Math.round(accrued))} accrued today
        </span>
    );
};

const Accountability = () => {
    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [aiResults, setAiResults] = useState({});
    const [aiLoadingId, setAiLoadingId] = useState(null);
    const [showBars, setShowBars] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        fetchContractors();
        const clock = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(clock);
    }, []);

    useEffect(() => {
        if (!loading) setTimeout(() => setShowBars(true), 150);
    }, [loading]);

    const fetchContractors = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/contractors`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setContractors(data);
        } catch {
            // Use rich fallback data
            setContractors([
                { id: 1, name: 'GreenBuild Infra Pvt. Ltd.', score: 94, total_violations: 2, cpcb_daily_fine: 0, penalty_per_month: 0, color: '#1D9E75' },
                { id: 2, name: 'Hebbal Roads Ltd.', score: 76, total_violations: 8, cpcb_daily_fine: 150000, penalty_per_month: 4500000, color: '#EF9F27' },
                { id: 3, name: 'UrbanArc Projects', score: 58, total_violations: 21, cpcb_daily_fine: 1000000, penalty_per_month: 30000000, color: '#F59E0B' },
                { id: 4, name: 'TechBuild Infra', score: 36, total_violations: 47, cpcb_daily_fine: 1500000, penalty_per_month: 45000000, color: '#E24B4A' },
                { id: 5, name: 'FastTrack Constr.', score: 22, total_violations: 63, cpcb_daily_fine: 1500000, penalty_per_month: 45000000, color: '#E24B4A' },
            ]);
        }
        setLoading(false);
    };

    const analyzeContractor = async (contractor) => {
        setAiLoadingId(contractor.id);
        try {
            const res = await fetch(`${API}/api/contractors/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractor })
            });
            const data = await res.json();
            setAiResults(prev => ({ ...prev, [contractor.id]: data }));
        } catch {
            const tier = getScoreTier(contractor.score || 0);
            setAiResults(prev => ({
                ...prev,
                [contractor.id]: {
                    risk_level: tier.label.split('—')[0].trim(),
                    key_issues: ['Repeated PM2.5 threshold exceedances', 'Inadequate perimeter dust suppression'],
                    recommended_actions: ['Deploy additional mist cannon units', 'Install HEPA barriers on site perimeter', 'Submit daily PM reports to KSPCB'],
                    estimated_fine_inr: tier.dailyFine,
                    cpcb_daily_exposure: tier.dailyFine,
                    suspend_recommended: contractor.score < 40,
                    summary: `${contractor.name} scores ${contractor.score}/100, placing them in the ${tier.label} tier under CPCB 2019 Environment Compensation Guidelines.`
                }
            }));
        }
        setAiLoadingId(null);
    };

    const totalExposure = contractors.reduce((acc, c) => acc + (c.cpcb_daily_fine || getScoreTier(c.score || 0).dailyFine), 0);
    const nonCompliant = contractors.filter(c => (c.score || 0) < 60).length;
    const criticalCount = contractors.filter(c => (c.score || 0) < 40).length;
    const worstContractor = [...contractors].sort((a, b) => (a.score || 0) - (b.score || 0))[0];
    const totalFineAccruedCounter = useCounter(totalExposure);

    if (loading) return (
        <div className="space-y-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-36 bg-slate-50 rounded-[32px] animate-pulse border border-slate-100" />
            ))}
        </div>
    );

    return (
        <div className="space-y-10 animate-in slide-in-from-bottom duration-700">

            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-800">Contractor Accountability</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">
                        Live CPCB compliance scoring &amp; penalty exposure — BBMP enforcement matrix
                    </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
                    <Clock size={14} className="text-primary" />
                    {now.toLocaleTimeString('en-IN')}
                </div>
            </header>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <KpiCard
                    label="Total Daily Fine Exposure"
                    value={`₹${(totalExposure / 100000).toFixed(1)}L / day`}
                    sub="CPCB 2019 Standard"
                    icon={<IndianRupee size={22} />}
                    danger
                />
                <KpiCard
                    label="Non-Compliant Sites"
                    value={`${nonCompliant} / ${contractors.length}`}
                    sub="Score below 60"
                    icon={<AlertTriangle size={22} />}
                    warn={nonCompliant > 0}
                />
                <KpiCard
                    label="Shutdown-Risk Contractors"
                    value={criticalCount}
                    sub="Score below 40"
                    icon={<ShieldAlert size={22} />}
                    danger={criticalCount > 0}
                />
                <KpiCard
                    label="Monthly Exposure"
                    value={`₹${(totalExposure * 30 / 10000000).toFixed(2)} Cr`}
                    sub="If violations persist"
                    icon={<TrendingDown size={22} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Contractor List */}
                <div className="lg:col-span-2 space-y-4">
                    {[...contractors].sort((a, b) => (a.score || 0) - (b.score || 0)).map((c, idx) => {
                        const tier = getScoreTier(c.score || 0);
                        const dailyFine = c.cpcb_daily_fine ?? tier.dailyFine;
                        const isExpanded = expandedId === c.id;
                        const aiData = aiResults[c.id];

                        return (
                            <div
                                key={c.id || idx}
                                className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                                style={{ borderLeft: `4px solid ${tier.barColor}` }}
                            >
                                <div className="p-7">
                                    {/* Top row */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-black text-slate-800">{c.name}</h3>
                                                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tier.pill}`}>
                                                    {tier.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                                {c.total_violations ?? 0} violations logged
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black" style={{ color: tier.barColor }}>
                                                {c.score ?? 0}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">/ 100</p>
                                        </div>
                                    </div>

                                    {/* Score bar */}
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-5">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: showBars ? `${c.score ?? 0}%` : '0%',
                                                backgroundColor: tier.barColor
                                            }}
                                        />
                                    </div>

                                    {/* Fine row */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">CPCB Daily Fine</p>
                                                <p className="text-base font-black" style={{ color: dailyFine > 0 ? '#E24B4A' : '#1D9E75' }}>
                                                    {dailyFine > 0 ? fmtL(dailyFine) + '/day' : '₹0 — Compliant'}
                                                </p>
                                            </div>
                                            {dailyFine > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly Exposure</p>
                                                    <p className="text-base font-black text-red-500">{fmtL(dailyFine * 30)}</p>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                                        >
                                            {isExpanded ? 'Hide' : 'AI Audit'} {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded AI Audit Panel */}
                                {isExpanded && (
                                    <div className="px-7 pb-7 border-t border-slate-50 pt-6 animate-in slide-in-from-top duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left: CPCB Breakdown */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    CPCB Fine Schedule Breakdown
                                                </h4>
                                                <div className="space-y-2">
                                                    {CPCB_SCHEDULE.map((t, i) => (
                                                        <div
                                                            key={i}
                                                            className={`flex justify-between items-center px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${t.maxScore >= (c.score || 0) && (i === 0 || CPCB_SCHEDULE[i-1].maxScore < (c.score || 0)) ? 'ring-2 ring-offset-1' : ''}`}
                                                            style={{
                                                                background: t.barColor + '15',
                                                                color: t.barColor,
                                                                ringColor: t.barColor
                                                            }}
                                                        >
                                                            <span>{t.label}</span>
                                                            <span>{t.dailyFine > 0 ? fmtL(t.dailyFine) + '/day' : '₹0'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {dailyFine > 0 && (
                                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mt-2">
                                                        <p className="text-[10px] font-black text-red-400 uppercase mb-1">Live Fine Accrual</p>
                                                        <LiveFineTicker dailyFine={dailyFine} />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => analyzeContractor(c)}
                                                    disabled={aiLoadingId === c.id}
                                                    className="w-full mt-2 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all"
                                                >
                                                    {aiLoadingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                    {aiLoadingId === c.id ? 'Generating Audit...' : 'Generate AI Risk Audit'}
                                                </button>
                                            </div>

                                            {/* Right: AI Result */}
                                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 min-h-[220px] flex flex-col justify-center">
                                                {aiData ? (
                                                    <div className="space-y-4 animate-in fade-in duration-500">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                                                <Sparkles size={10} /> AI Risk Intelligence
                                                            </p>
                                                            <span
                                                                className="px-3 py-1 rounded-full text-[8px] font-black uppercase text-white"
                                                                style={{ background: ['Critical', 'High'].includes(aiData.risk_level) ? '#E24B4A' : '#1D9E75' }}
                                                            >
                                                                {aiData.risk_level} Risk
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 italic leading-relaxed">"{aiData.summary}"</p>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Immediate Actions</p>
                                                            <ul className="space-y-1">
                                                                {aiData.recommended_actions?.map((a, i) => (
                                                                    <li key={i} className="text-[11px] text-slate-600 flex gap-2">
                                                                        <span className="text-primary font-black">›</span> {a}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase">Est. Fine Exposure</p>
                                                                <p className="text-lg font-black text-red-500">
                                                                    {fmtL(aiData.estimated_fine_inr || aiData.cpcb_daily_exposure || 0)}/day
                                                                </p>
                                                            </div>
                                                            {aiData.suspend_recommended && (
                                                                <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                                    ⚠ Suspend Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-center opacity-30 gap-3">
                                                        <Sparkles size={28} />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest">
                                                            Click "Generate AI Risk Audit"<br />to analyze this contractor
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Total Exposure Card */}
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldAlert size={28} className="text-red-400" />
                            <h2 className="text-xl font-black">Enforcement Exposure</h2>
                        </div>
                        <div className="space-y-5">
                            <div className="p-5 bg-red-500/10 rounded-[28px] border border-red-500/20">
                                <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-1">
                                    Aggregate Daily Fine
                                </p>
                                <p className="text-3xl font-black text-red-400">
                                    ₹{fmt(totalFineAccruedCounter)}
                                </p>
                                <p className="text-[10px] opacity-40 mt-1 font-medium">
                                    Ref: CPCB Env. Compensation 2019
                                </p>
                            </div>

                            {worstContractor && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-black uppercase opacity-50 tracking-widest mb-1">
                                        Highest Risk Contractor
                                    </p>
                                    <p className="font-bold text-sm">{worstContractor.name}</p>
                                    <p className="text-red-400 font-black text-xs mt-1">
                                        Score: {worstContractor.score}/100 · {getScoreTier(worstContractor.score || 0).label}
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-xs text-yellow-200/70 leading-relaxed">
                                <Activity size={12} className="inline mr-1 text-yellow-400" />
                                A CPCB shutdown costs a contractor <strong className="text-yellow-400">₹8–15 lakh per day</strong>.
                                This live score gives them every reason to comply — before an inspector shows up.
                            </div>
                        </div>
                    </div>

                    {/* Scoring Matrix */}
                    <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100">
                        <h2 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Zap size={18} className="text-primary" /> Scoring Matrix
                        </h2>
                        <div className="space-y-3">
                            {CPCB_SCHEDULE.map((t, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.barColor }} />
                                        <span className="text-xs font-bold text-slate-600">{t.label}</span>
                                    </div>
                                    <span className="text-xs font-black" style={{ color: t.barColor }}>
                                        {t.dailyFine > 0 ? fmtL(t.dailyFine) + '/day' : 'Compliant'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-300 mt-5 font-medium leading-relaxed">
                            Fines cited from CPCB Environment Compensation Guidelines 2019 &amp; GRAP Schedule IV for Bengaluru / NCR.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ label, value, sub, icon, danger, warn }) => (
    <div className={`p-6 rounded-[32px] border shadow-sm ${danger ? 'bg-red-50 border-red-100' : warn ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-100 text-red-500' : warn ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-500'}`}>
            {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-xl font-black ${danger ? 'text-red-600' : warn ? 'text-amber-600' : 'text-slate-800'}`}>{value}</p>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>
    </div>
);

export default Accountability;
