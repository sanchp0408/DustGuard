import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { 
    Upload, ShieldCheck, AlertCircle, RefreshCcw, ImageIcon, 
    X, Zap, CheckCircle2, History, Loader2, Info 
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Detection = () => {
    const imageRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [model, setModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [predictions, setPredictions] = useState([]);
    const [claudeAnalysis, setClaudeAnalysis] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [inferenceTime, setInferenceTime] = useState(null);
    const [history, setHistory] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const socket = useSocket();
    const [pmLevels, setPmLevels] = useState({ pm25: 45, pm10: 72 });

    useEffect(() => {
        const loadModel = async () => {
            const m = await cocoSsd.load();
            setModel(m);
            setLoading(false);
        };
        loadModel();
        fetchHistory();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('sensor_update', (data) => {
            if (data.site_id === 1) setPmLevels({ pm25: data.pm25, pm10: data.pm10 });
        });
    }, [socket]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API}/api/detections/recent`);
            setHistory(await res.json());
        } catch (err) {
            console.error("History fetch failed", err);
        }
    };

    const analyzeWithClaude = async (preds, pm) => {
        // Mocking Claude response structure for this demo as per user requirements
        // In production, this would call the actual Anthropic API or a backend proxy
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    dust_risk: pm.pm25 > 100 ? "Critical" : pm.pm25 > 60 ? "High" : "Medium",
                    risk_score: pm.pm25 > 100 ? 92 : pm.pm25 > 60 ? 68 : 42,
                    primary_sources: preds.map(p => p.class).filter((v, i, a) => a.indexOf(v) === i),
                    recommended_actions: [
                        "Activate Zone A & B sprinklers immediately",
                        "Restrict heavy vehicle movement for 30 mins",
                        "Verify perimeter mesh integrity"
                    ],
                    suppression_urgency: pm.pm25 > 60 ? "immediate" : "within_15min",
                    compliance_flag: pm.pm25 < 60,
                    reasoning: `High density of ${preds.length} objects detected alongside elevated PM2.5 levels of ${pm.pm25} μg/m³.`
                });
            }, 1500);
        });
    };

    const runDetection = useCallback(async (imgElement) => {
        if (!model || !imgElement) return;
        setAnalyzing(true);
        const start = performance.now();
        const preds = await model.detect(imgElement);
        const elapsed = (performance.now() - start).toFixed(0);
        setInferenceTime(elapsed);
        setPredictions(preds);
        drawBoxes(preds, imgElement);
        
        // Multi-model pipeline step
        const claudeRes = await analyzeWithClaude(preds, pmLevels);
        setClaudeAnalysis(claudeRes);
        setAnalyzing(false);

        // Save to backend
        saveToBackend(preds, claudeRes);
    }, [model, pmLevels]);

    const saveToBackend = async (preds, claude) => {
        setSaving(true);
        try {
            await fetch(`${API}/api/detections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    site_id: 1,
                    image_name: `upload_${Date.now()}.jpg`,
                    objects_detected: preds,
                    dust_risk_level: claude.dust_risk,
                    confidence_avg: (preds.reduce((acc, curr) => acc + curr.score, 0) / preds.length).toFixed(2),
                    pm25_at_time: pmLevels.pm25
                })
            });

            if (claude.dust_risk === 'High' || claude.dust_risk === 'Critical') {
                await fetch(`${API}/api/alerts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        site_id: 1,
                        alert_type: 'EQUIPMENT_DETECTED',
                        severity: claude.dust_risk === 'Critical' ? 'critical' : 'warning',
                        message: `AI Vision Alert: ${claude.dust_risk} risk detected via image analysis. Score: ${claude.risk_score}`
                    })
                });
            }
            fetchHistory();
        } catch (err) {
            console.error("Failed to save detection", err);
        }
        setSaving(false);
    };

    const drawBoxes = (preds, imgElement) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        preds.forEach(p => {
            const [x, y, width, height] = p.bbox;
            ctx.shadowColor = '#E24B4A';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#E24B4A';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#E24B4A';
            const text = `${p.class} ${(p.score * 100).toFixed(1)}%`;
            ctx.font = 'bold 14px monospace';
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x, y - 28, textWidth + 14, 28);
            ctx.fillStyle = 'white';
            ctx.fillText(text, x + 7, y - 9);
        });
    };

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setImageLoaded(false);
        setPredictions([]);
        setClaudeAnalysis(null);
        setInferenceTime(null);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">AI Visual Analytics</h1>
                    <p className="text-slate-500">Multi-model pipeline: COCO-SSD + Claude Environmental Insight.</p>
                </div>
                {saving && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold animate-pulse">
                        <Loader2 size={14} className="animate-spin" /> Saving to intelligence node...
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div
                        className={`relative bg-dark rounded-[32px] overflow-hidden shadow-2xl border-4 transition-all duration-300 ${
                            dragOver ? 'border-primary scale-[1.01]' : 'border-white'
                        } aspect-video flex items-center justify-center`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                    >
                        {!imageSrc ? (
                            <div className="text-center p-12 cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="text-slate-400 mb-6" size={48} />
                                <h3 className="text-white text-xl font-bold">Upload Construction Site Image</h3>
                                <p className="text-slate-500 mt-2">Instantly analyze dust risk via computer vision</p>
                            </div>
                        ) : (
                            <>
                                <img ref={imageRef} src={imageSrc} alt="Site" onLoad={() => setImageLoaded(true)} className="absolute inset-0 w-full h-full object-contain bg-black" />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                                <button onClick={() => setImageSrc(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-danger/60 transition-colors">
                                    <X size={16} />
                                </button>
                            </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                    </div>

                    {imageLoaded && (
                        <button
                            onClick={() => runDetection(imageRef.current)}
                            disabled={analyzing}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-xl shadow-primary/20"
                        >
                            {analyzing ? <><RefreshCcw size={20} className="animate-spin" /> Deep Analytics in Progress...</> : <><Zap size={20} /> Execute AI Pipeline</>}
                        </button>
                    )}

                    {claudeAnalysis && (
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 animate-in slide-in-from-top duration-500">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold">Claude Intelligence Report</h2>
                                    <p className="text-slate-500 mt-1">{claudeAnalysis.reasoning}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-full font-bold uppercase text-[10px] tracking-widest ${
                                    claudeAnalysis.dust_risk === 'Critical' ? 'bg-danger text-white' : 
                                    claudeAnalysis.dust_risk === 'High' ? 'bg-orange-500 text-white' : 'bg-primary text-white'
                                }`}>
                                    {claudeAnalysis.dust_risk} Risk
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Score Gauge</p>
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-24 h-24">
                                                <svg className="w-24 h-24 -rotate-90">
                                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * claudeAnalysis.risk_score) / 100} className="text-primary transition-all duration-1000" />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-slate-800">{claudeAnalysis.risk_score}</div>
                                            </div>
                                            <div>
                                                <div className={`flex items-center gap-2 font-bold ${claudeAnalysis.compliance_flag ? 'text-emerald-500' : 'text-danger'}`}>
                                                    {claudeAnalysis.compliance_flag ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                    {claudeAnalysis.compliance_flag ? 'Compliant' : 'Violation Detected'}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tighter">Urgency: {claudeAnalysis.suppression_urgency}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Primary Dust Sources</p>
                                        <div className="flex flex-wrap gap-2">
                                            {claudeAnalysis.primary_sources.map(s => (
                                                <span key={s} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 capitalize">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Recommended Actions</p>
                                    <div className="space-y-3">
                                        {claudeAnalysis.recommended_actions.map((a, i) => (
                                            <div key={i} className="flex gap-3 text-sm font-medium text-slate-700">
                                                <div className="w-5 h-5 rounded-md border-2 border-primary/20 flex items-center justify-center text-primary mt-0.5"><CheckCircle2 size={12} /></div>
                                                {a}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><History size={20} className="text-primary" /> Recent Detections</h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {history.map((h, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(h.created_at).toLocaleTimeString()}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                            h.dust_risk_level === 'Critical' ? 'bg-danger text-white' : 'bg-primary/20 text-primary'
                                        }`}>{h.dust_risk_level}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 truncate">{h.site_name}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">PM2.5 @ Time: {h.pm25_at_time} μg/m³</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Info size={20} className="text-primary" /> Visual Telemetry</h2>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold">PM2.5 Level</span>
                                    <span className={`text-sm font-bold ${pmLevels.pm25 > 60 ? 'text-danger' : 'text-primary'}`}>{pmLevels.pm25} μg/m³</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-500 ${pmLevels.pm25 > 60 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${Math.min(pmLevels.pm25, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Detection;
