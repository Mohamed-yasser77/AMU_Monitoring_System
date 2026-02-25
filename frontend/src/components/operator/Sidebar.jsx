import React from 'react';
import {
    Users,
    Home,
    Activity,
    AlertCircle,
    LogOut,
    ChevronRight,
    LayoutGrid
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, userName, onLogout }) => {
    const menuItems = [
        { id: 'owners', label: 'Owners', icon: Users },
        { id: 'farms', label: 'Farms', icon: Home },
        { id: 'flocks', label: 'Flocks', icon: LayoutGrid },
        { id: 'treatments', label: 'Treatments', icon: Activity },
        { id: 'problems', label: 'Health Issues', icon: AlertCircle },
    ];

    return (
        <div className="flex flex-col h-full bg-white text-slate-500 w-64 fixed left-0 top-0 z-20 border-r border-slate-100 transition-all duration-300 shadow-[1px_0_10px_rgba(0,0,0,0.01)]">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-10 animate-slide-up">
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 transition-colors">
                        <Activity size={24} className="text-[#4f46e5]" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900">AMU <span className="text-[#4f46e5]">Monitor</span></span>
                </div>

                <nav className="space-y-1.5 border-t border-slate-50 pt-8">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden animate-slide-up`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#4f46e5] rounded-r-full shadow-[0_0_15px_rgba(79,70,229,0.3)]" />
                                )}
                                <div className="flex items-center gap-3.5 relative z-10">
                                    <Icon
                                        size={18}
                                        className={`transition-all duration-300 ${isActive ? 'text-[#4f46e5]' : 'text-slate-400 group-hover:text-slate-600'}`}
                                    />
                                    <span className={`font-bold text-sm tracking-tight transition-all ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {isActive && <ChevronRight size={14} className="text-[#4f46e5]/40 animate-in fade-in slide-in-from-left-2" />}

                                <div className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'bg-slate-50' : 'bg-slate-50/50 opacity-0 group-hover:opacity-100'}`} />
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 bg-slate-50/30 border-t border-slate-100">
                <div className="flex items-center gap-3.5 mb-6 px-3 py-3 bg-white/50 rounded-2xl border border-slate-100 group transition-all hover:bg-white cursor-default">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-[#4f46e5]">
                            {userName?.charAt(0) || 'O'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate text-slate-800 uppercase tracking-widest">{userName}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-rose-50 text-xs hover:text-rose-500 transition-all duration-300 group"
                >
                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
