import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/operator/Sidebar';
import SearchableTable from '../components/operator/SearchableTable';
import FarmForm from '../components/operator/FarmForm';
import FlockForm from '../components/operator/FlockForm';
import { Plus, LayoutGrid, Activity, Home, Users, ChevronRight, TrendingUp, Search, Settings, AlertCircle, Layers } from 'lucide-react';

const speciesMapping = {
    'AVI': 'Avian',
    'BOV': 'Bovine',
    'SUI': 'Suine',
    'CAP': 'Caprine',
    'OVI': 'Ovine',
    'EQU': 'Equine',
    'LEP': 'Leporine',
    'PIS': 'Pisces',
    'CAM': 'Camelids',
    'API': 'Apiculture'
};

const speciesColors = {
    'AVI': '#00c096',
    'BOV': '#6366f1',
    'SUI': '#f43f5e',
    'CAP': '#f59e0b',
    'OVI': '#3b82f6',
    'EQU': '#8b5cf6',
    'LEP': '#10b981',
    'PIS': '#06b6d4',
    'CAM': '#f97316',
    'API': '#ec4899'
};

const OperatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [owners, setOwners] = useState([]);
    const [farms, setFarms] = useState([]);
    const [flocks, setFlocks] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFarmForm, setShowFarmForm] = useState(false);
    const [showFlockForm, setShowFlockForm] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const email = user.email;
            const [oRes, fRes, flRes, tRes, pRes] = await Promise.all([
                fetch(`http://localhost:8000/api/owners/?email=${email}`),
                fetch(`http://localhost:8000/api/farms/?email=${email}`),
                fetch(`http://localhost:8000/api/flocks/?email=${email}`),
                fetch(`http://localhost:8000/api/treatments/?email=${email}`),
                fetch(`http://localhost:8000/api/problems/?email=${email}`)
            ]);
            const ownersData = oRes.ok ? await oRes.json() : [];
            const farmsData = fRes.ok ? await fRes.json() : [];
            const flocksData = flRes.ok ? await flRes.json() : [];
            const treatmentsData = tRes.ok ? await tRes.json() : [];
            const problemsData = pRes.ok ? await pRes.json() : [];
            setOwners(ownersData);
            setFarms(farmsData);
            setFlocks(flocksData);
            setTreatments(treatmentsData);
            setProblems(problemsData);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'data_operator' && user.role !== 'farmer') { navigate('/login'); return; }
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- Derived Stats ---
    const totalLivestock = flocks.reduce((acc, f) => acc + (f.size || 0), 0);
    const pendingCount = treatments.filter(t => t.status === 'pending').length;
    const approvedCount = treatments.filter(t => t.status === 'approved').length;

    // Aggregate flocks by species for the Species Mix card
    const speciesCounts = flocks.reduce((acc, f) => {
        const key = f.species_type || 'Other';
        acc[key] = (acc[key] || 0) + (f.size || 0);
        return acc;
    }, {});
    const speciesEntries = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxSpeciesCount = speciesEntries.length > 0 ? speciesEntries[0][1] : 1;

    // --- Dashboard Home View ---
    const renderDashboard = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Hero + Side Stats */}
            <div className="grid grid-cols-3 gap-6">
                {/* Hero Card */}
                <div className="col-span-2 bg-[#00c096] rounded-xl p-8 relative overflow-hidden teal-glow-strong group">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div>
                            <p className="text-white/70 font-medium text-xs mb-2 uppercase tracking-widest">Total Registered Livestock</p>
                            <h2 className="text-5xl font-bold text-white tracking-tight leading-none mb-4">
                                {totalLivestock.toLocaleString()} <span className="text-xl opacity-50 font-normal">animals</span>
                            </h2>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="space-y-3">
                                <div className="w-56 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, approvedCount / Math.max(treatments.length, 1) * 100)}%` }} />
                                </div>
                                <p className="text-white/60 text-xs leading-relaxed max-w-xs">
                                    {approvedCount} of {treatments.length} treatment logs approved. Monitor farm compliance regularly.
                                </p>
                                <button onClick={() => setActiveTab('treatments')} className="text-white font-medium text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                    View Treatments <ChevronRight size={14} />
                                </button>
                            </div>
                            <div className="bg-[#14171a]/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-bold">
                                {treatments.length > 0 ? Math.round(approvedCount / treatments.length * 100) : 0}% APPROVED
                            </div>
                        </div>
                    </div>
                    <div className="absolute right-8 top-8 flex items-center gap-2 text-white">
                        <div className="p-1 rounded bg-white/20"><TrendingUp size={12} strokeWidth={3} /></div>
                        <span className="text-lg font-bold">{owners.length}</span>
                        <span className="text-[10px] opacity-60">owners registered</span>
                    </div>
                    <div className="absolute -right-16 -bottom-16 opacity-10 transform scale-150 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-1000">
                        <Activity size={250} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Side Stats */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface-card rounded-xl p-6 border border-white/5 group hover:border-teal-accent/20 transition-all">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-1">Active Farms</p>
                                <h3 className="text-3xl font-bold text-white">{farms.length}</h3>
                            </div>
                            <div className="p-2 bg-teal-accent/10 rounded-lg text-teal-accent">
                                <Home size={18} />
                            </div>
                        </div>
                        <div className="h-8 flex items-end gap-0.5">
                            {[30, 50, 40, 60, 45, 70, 55, farms.length > 0 ? 80 : 20].map((h, i) => (
                                <div key={i} className="flex-1 bg-teal-accent/20 rounded-sm group-hover:bg-teal-accent/40 transition-colors" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface-card rounded-xl p-6 border border-white/5 group hover:border-teal-accent/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-1">Pending Logs</p>
                                <h3 className="text-3xl font-bold text-white">{pendingCount} <span className="text-xs text-amber-400 font-medium">review</span></h3>
                            </div>
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                <AlertCircle size={18} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, pendingCount / Math.max(treatments.length, 1) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500">{pendingCount}/{treatments.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Feed + Species Mix */}
            <div className="grid grid-cols-3 gap-6">
                {/* Latest Treatment Logs */}
                <div className="col-span-2 bg-surface-card rounded-xl p-8 border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-base font-bold text-white">Latest Treatment Logs</h4>
                        <button onClick={() => setActiveTab('treatments')} className="text-[10px] font-medium text-teal-accent uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        {treatments.length === 0 && (
                            <p className="text-slate-600 text-sm text-center py-8">No treatments recorded yet.</p>
                        )}
                        {treatments.slice(0, 4).map((log, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                        <Activity size={16} className="text-teal-accent opacity-60" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{log.antibiotic_name}</p>
                                        <p className="text-slate-500 text-[10px] uppercase tracking-widest">{log.farm__name} • {log.date}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-md text-[10px] font-medium uppercase tracking-widest ${log.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : log.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {log.status || 'pending'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Species Mix */}
                <div className="bg-surface-card rounded-xl p-8 border border-white/5">
                    <h4 className="text-base font-bold text-white mb-1">Species Mix</h4>
                    <p className="text-slate-500 text-[10px] font-medium mb-6 uppercase tracking-widest">Across all flocks</p>
                    <div className="space-y-5">
                        {speciesEntries.length === 0 && (
                            <p className="text-slate-600 text-sm text-center py-4">No flock data.</p>
                        )}
                        {speciesEntries.map(([code, count], i) => (
                            <div key={i} className="flex items-center gap-3 group cursor-default">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: speciesColors[code] || '#94a3b8' }} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-medium text-[11px] tracking-widest">{speciesMapping[code] || code}</span>
                                        <span className="text-slate-400 text-xs">{count.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(count / maxSpeciesCount) * 100}%`, backgroundColor: speciesColors[code] || '#94a3b8' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick summary stats */}
                    {owners.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Owners</p>
                                <p className="text-xl font-bold text-white">{owners.length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Flocks</p>
                                <p className="text-xl font-bold text-white">{flocks.length}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // --- Data Section Renderers ---
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return renderDashboard();

            case 'owners':
                return (
                    <SearchableTable
                        title="All Owners"
                        data={owners}
                        searchPlaceholder="Search by name, email, phone..."
                        columns={[
                            { header: 'Name', accessor: 'name' },
                            { header: 'Email', accessor: 'email' },
                            { header: 'Phone', accessor: 'phone_number' },
                            {
                                header: 'Farms Managed',
                                render: (row) => (
                                    <div className="flex flex-wrap gap-1.5">
                                        {row.farms?.length > 0
                                            ? row.farms.map((farm, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-teal-accent/10 text-teal-accent rounded text-[10px] font-medium uppercase tracking-wider border border-teal-accent/20">
                                                    {farm}
                                                </span>
                                            ))
                                            : <span className="text-slate-600 text-xs">No farms</span>
                                        }
                                    </div>
                                )
                            }
                        ]}
                    />
                );

            case 'farms':
                return (
                    <SearchableTable
                        title="All Farms"
                        data={farms}
                        searchPlaceholder="Search by name, number, species..."
                        columns={[
                            { header: 'Farm Name', accessor: 'name' },
                            { header: 'Reg. Number', accessor: 'farm_number' },
                            {
                                header: 'Species',
                                render: (row) => (
                                    <span className="text-teal-accent font-medium text-sm">
                                        {speciesMapping[row.species_type] || row.species_type}
                                    </span>
                                )
                            },
                            {
                                header: 'Type',
                                render: (row) => (
                                    <span className="capitalize px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-medium border border-indigo-500/20">
                                        {row.farm_type}
                                    </span>
                                )
                            },
                            { header: 'Total Animals', accessor: 'total_animals' },
                            { header: 'Owner', accessor: 'owner_name' }
                        ]}
                        actions={
                            <button
                                onClick={() => setShowFarmForm(true)}
                                className="px-5 py-3 bg-[#00c096] text-[#14171a] rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#00d4a6] transition-all flex items-center gap-2"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Add Farm
                            </button>
                        }
                    />
                );

            case 'flocks':
                return (
                    <SearchableTable
                        title="All Flocks"
                        data={flocks}
                        searchPlaceholder="Search by flock tag, species..."
                        columns={[
                            { header: 'Flock Tag', accessor: 'flock_tag' },
                            {
                                header: 'Species',
                                render: (row) => (
                                    <span className="font-medium text-sm" style={{ color: speciesColors[row.species_type] || '#94a3b8' }}>
                                        {speciesMapping[row.species_type] || row.species_type}
                                    </span>
                                )
                            },
                            {
                                header: 'Size',
                                render: (row) => (
                                    <span className="text-white font-bold">{(row.size || 0).toLocaleString()}</span>
                                )
                            },
                            { header: 'Age (Weeks)', accessor: 'age_in_weeks' },
                            { header: 'Farm', accessor: 'farm_name' },
                        ]}
                        actions={
                            <button
                                onClick={() => setShowFlockForm(true)}
                                className="px-5 py-3 bg-[#00c096] text-[#14171a] rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#00d4a6] transition-all flex items-center gap-2 shadow-lg shadow-[#00c096]/10"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Add Flock
                            </button>
                        }
                    />
                );

            case 'treatments':
                return (
                    <SearchableTable
                        title="Treatment Logs"
                        data={treatments}
                        searchPlaceholder="Search by antibiotic, farm, date..."
                        columns={[
                            {
                                header: 'Farm',
                                render: (row) => (
                                    <div>
                                        <p className="text-white font-medium text-sm">{row.farm__name}</p>
                                        <p className="text-slate-500 text-[10px]">{row.farm__farm_number}</p>
                                    </div>
                                )
                            },
                            {
                                header: 'Target',
                                render: (row) => (
                                    <div className="flex flex-col">
                                        {row.animal__animal_tag ? (
                                            <>
                                                <span className="text-white font-bold text-xs">{row.animal__animal_tag}</span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tighter text-teal-accent/70">Individual Animal</span>
                                            </>
                                        ) : row.flock__flock_tag ? (
                                            <>
                                                <span className="text-white font-medium text-xs font-mono">{row.flock__flock_tag}</span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tighter text-indigo-400/70">Whole Flock</span>
                                            </>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Whole Farm</span>
                                        )}
                                    </div>
                                )
                            },
                            { header: 'Antibiotic', accessor: 'antibiotic_name' },
                            {
                                header: 'Reason',
                                render: (row) => (
                                    <span className="capitalize text-slate-300">{(row.reason || '').replace(/_/g, ' ')}</span>
                                )
                            },
                            { header: 'Date', accessor: 'date' },
                            {
                                header: 'Status',
                                render: (row) => {
                                    const cls = {
                                        'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                        'approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                        'rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    };
                                    const status = row.status || 'pending';
                                    return (
                                        <span className={`px-3 py-1 rounded-md text-[10px] uppercase font-medium border ${cls[status] || cls.pending}`}>
                                            {status}
                                        </span>
                                    );
                                }
                            }
                        ]}
                        actions={
                            <button
                                onClick={() => navigate('/log-treatment')}
                                className="px-5 py-3 bg-[#00c096] text-[#14171a] rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#00d4a6] transition-all flex items-center gap-2 shadow-lg shadow-[#00c096]/10"
                            >
                                <Activity size={16} strokeWidth={3} />
                                Log Treatment
                            </button>
                        }
                    />
                );

            default:
                return null;
        }
    };

    if (loading && !owners.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-accent"></div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Loading data...</p>
                </div>
            </div>
        );
    }

    const tabLabels = { dashboard: 'Overview', owners: 'Owners', farms: 'Farms', flocks: 'Flocks', treatments: 'Treatments' };

    return (
        <div className="min-h-screen bg-surface-bg flex relative overflow-hidden">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={user?.name} onLogout={handleLogout} />

            <main className="flex-1 ml-64 p-8 animate-fade-in custom-scrollbar overflow-y-auto h-screen">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 animate-slide-up">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {tabLabels[activeTab] || activeTab}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-teal-accent uppercase tracking-[0.2em]">AMU Monitoring</span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">{tabLabels[activeTab]}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-surface-card border border-white/5 rounded-xl px-4 py-2.5 text-slate-400">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-600 w-48 outline-none"
                            />
                        </div>
                        <div className="p-2.5 bg-teal-accent text-[#14171a] rounded-xl cursor-pointer hover:opacity-90 transition-opacity teal-glow">
                            <Settings size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                    {renderContent()}
                </div>

                {/* Modals */}
                {showFarmForm && (
                    // ... existing modal ...
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl overflow-hidden">
                            <FarmForm
                                onCancel={() => setShowFarmForm(false)}
                                onSuccess={() => { setShowFarmForm(false); fetchData(); }}
                                owners={owners}
                                userEmail={user?.email}
                            />
                        </div>
                    </div>
                )}

                {showFlockForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl overflow-hidden">
                            <FlockForm
                                onCancel={() => setShowFlockForm(false)}
                                onSuccess={() => { setShowFlockForm(false); fetchData(); }}
                                farms={farms}
                                userEmail={user?.email}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OperatorDashboard;
