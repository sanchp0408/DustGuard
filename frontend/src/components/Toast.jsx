import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] space-y-4 w-full max-w-sm">
                {toasts.map(toast => (
                    <div 
                        key={toast.id} 
                        className={`p-5 rounded-2xl shadow-2xl border flex items-start gap-4 animate-in slide-in-from-right duration-500 backdrop-blur-xl ${
                            toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                            toast.type === 'warning' ? 'bg-orange-500/90 border-orange-400 text-white' :
                            toast.type === 'error' ? 'bg-red-600/90 border-red-500 text-white' :
                            'bg-slate-800/90 border-slate-700 text-white'
                        }`}
                    >
                        <div className="mt-0.5">
                            {toast.type === 'success' && <CheckCircle2 size={20} />}
                            {toast.type === 'warning' && <AlertTriangle size={20} />}
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black tracking-tight">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
