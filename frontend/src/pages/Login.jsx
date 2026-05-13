import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('admin@dustguard.ai');
    const [password, setPassword] = useState('admin123');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) navigate('/');
        else alert('Invalid credentials');
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-dark to-dark">
            <div className="w-full max-w-md animate-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/40">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">DustGuard AI</h1>
                    <p className="text-slate-400 mt-2 font-medium">Environmental Compliance & Suppression</p>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Node</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="email" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                                    placeholder="admin@dustguard.ai"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Security Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="password" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                            Initialize Session <ArrowRight size={20} />
                        </button>
                    </form>
                    
                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-slate-500 text-xs font-medium">
                            Authorized personnel only. All access is logged and recorded.
                        </p>
                    </div>
                </div>
                
                <div className="mt-12 flex justify-center gap-8 opacity-50">
                    <img src="https://upload.wikimedia.org/wikipedia/en/3/35/Logo_of_CPCB.png" className="h-10 grayscale invert" alt="CPCB" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Karnataka_Logo.png" className="h-10 grayscale invert" alt="Karnataka Govt" />
                </div>
            </div>
        </div>
    );
};

export default Login;
