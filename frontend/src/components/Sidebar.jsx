import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, Scan, Droplets, Users, BarChart3, Settings, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout, user } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Detection', path: '/detection', icon: <Scan size={20} /> },
        { name: 'Suppression', path: '/suppression', icon: <Droplets size={20} /> },
        { name: 'Accountability', path: '/accountability', icon: <Users size={20} /> },
        { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} /> },
    ];

    if (user?.role === 'admin') {
        navItems.push({ name: 'Settings', path: '/settings', icon: <Settings size={20} /> });
    }

    return (
        <aside className="w-64 bg-dark text-white flex flex-col h-screen sticky top-0 shadow-2xl">
            <div className="p-6 flex items-center gap-3 border-b border-white/10">
                <div className="p-2 bg-primary rounded-lg shadow-lg">
                    <ShieldCheck size={24} />
                </div>
                <span className="font-bold text-xl tracking-tight">DustGuard AI</span>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group ${
                                isActive 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        <span className="transition-transform duration-300 group-hover:scale-110">
                            {item.icon}
                        </span>
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="p-4 bg-white/5 rounded-2xl mb-4">
                    <p className="text-xs text-slate-400">Logged in as</p>
                    <p className="font-semibold truncate">{user?.email}</p>
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-1">{user?.role}</p>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center gap-4 w-full p-3 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-all duration-300"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
