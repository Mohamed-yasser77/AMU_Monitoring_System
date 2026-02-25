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
        <div className="flex flex-col h-full bg-slate-900 text-white w-64 fixed left-0 top-0 shadow-xl z-20 transition-all duration-300">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-500 p-2 rounded-lg">
                        <Activity size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AMU Monitor</span>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-indigo-400'} />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {isActive && <ChevronRight size={16} />}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-lg">
                        {userName?.charAt(0) || 'O'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{userName}</p>
                        <p className="text-xs text-slate-500 truncate">Data Operator</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
