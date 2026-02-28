import React from 'react';
import {
    LayoutDashboard,
    ClipboardList,
    Pill,
    BookOpen,
    LogOut,
    ChevronRight,
    Activity,
    Plus
} from 'lucide-react';

const VetSidebar = ({ activeTab, setActiveTab, userName, onLogout, pendingCount }) => {
    const [clickEffect, setClickEffect] = React.useState(null);

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'treatments', label: 'Treatments', icon: ClipboardList, badge: pendingCount },
        { id: 'prescribe', label: 'Prescribe', icon: Pill },
        { id: 'reference', label: 'Drug Database', icon: BookOpen },
    ];

    const handleTabClick = (id) => {
        setClickEffect(id);
        setActiveTab(id);
        setTimeout(() => setClickEffect(null), 600);
    };

    return (
        <div className="flex flex-col h-screen bg-[#1c2025] text-slate-400 w-64 fixed left-0 top-0 z-30 border-r border-white/5 shadow-2xl transition-all duration-300">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="flex items-center gap-3 mb-12 animate-slide-up">
                    <div className="bg-teal-accent/10 p-2.5 rounded-lg border border-teal-accent/20 transition-all teal-glow">
                        <Plus size={24} className="text-teal-accent" />
                    </div>
                    <span className="text-sm font-bold tracking-[0.2em] text-white uppercase">Vet <span className="text-teal-accent">Dashboard</span></span>
                </div>

                <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Main Menu</p>
                    <nav className="space-y-1">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            const isClicking = clickEffect === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabClick(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg transition-all duration-300 group relative overflow-hidden animate-slide-up hover-green-fade`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {isClicking && (
                                        <div className="absolute inset-0 animate-green-fade z-0" />
                                    )}
                                    <div className="flex items-center gap-4 relative z-10 font-medium">
                                        <Icon
                                            size={20}
                                            className={`transition-all duration-300 ${isActive ? 'text-teal-accent' : 'text-slate-500 group-hover:text-slate-300'}`}
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm tracking-tight transition-all ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                {item.label}
                                            </span>
                                            {item.badge > 0 && (
                                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-accent rounded-l-full shadow-[0_0_15px_rgba(0,192,150,0.4)]" />
                                    )}

                                    <div className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'bg-teal-accent/10' : 'bg-white/5 opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-12 p-5 rounded-lg bg-teal-accent/5 border border-teal-accent/10 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[11px] font-bold text-white leading-relaxed mb-4">New Prescription</p>
                        <button onClick={() => setActiveTab('prescribe')} className="p-2 bg-teal-accent text-[#14171a] rounded-xl hover:scale-110 transition-transform">
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform">
                        <Pill size={80} strokeWidth={4} />
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Section */}
            <div className="p-6 space-y-4 border-t border-white/5 bg-[#1c2025]">
                <div className="flex items-center gap-3.5 px-3 py-3 rounded-lg border border-white/5 bg-white/[0.02] group transition-all hover:bg-white/[0.05] cursor-default">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:text-teal-accent transition-colors">
                            {userName?.charAt(0) || 'V'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#1c2025] rounded-full" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate text-white uppercase tracking-widest">{userName || 'Veterinarian'}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vet Specialist</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300"
                >
                    <LogOut size={16} />
                    <span className="text-xs">Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default VetSidebar;
