import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/operator/Sidebar';
import SearchableTable from '../components/operator/SearchableTable';
import FarmForm from '../components/operator/FarmForm';
import FlockForm from '../components/operator/FlockForm';
import { Plus, LayoutGrid, Activity, Home, Users, ChevronRight, TrendingUp, Search, Settings, AlertCircle, CheckCircle, Layers, FileText, XCircle, Bell } from 'lucide-react';
import api from '../services/api';

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
    const [vetDirectives, setVetDirectives] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFarmForm, setShowFarmForm] = useState(false);
    const [showFlockForm, setShowFlockForm] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [readDirectives, setReadDirectives] = useState(() => JSON.parse(localStorage.getItem('readDirectives')) || []);
    const [highlightedTreatmentId, setHighlightedTreatmentId] = useState(null);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [ownersData, farmsData, flocksData, treatmentsData, problemsData] = await Promise.all([
                api.get('/owners/'),
                api.get('/farms/'),
                api.get('/flocks/'),
                api.get('/treatments/'),
                api.get('/problems/')
            ]);

            setOwners(ownersData || []);
            setFarms(farmsData || []);
            setFlocks(flocksData || []);

            // Separate operator-logged requests from direct vet prescriptions
            const treatmentsArray = Array.isArray(treatmentsData) ? treatmentsData : [];
            const operatorLogs = treatmentsArray.filter(t => t.recorded_by__role !== 'vet');
            const vetLogs = treatmentsArray.filter(t => t.recorded_by__role === 'vet');

            setTreatments(operatorLogs);
            setVetDirectives(vetLogs);
            setProblems(problemsData || []);
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

        // Auto-refresh data every 30 seconds to update safety status in real-time
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user?.email]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- Derived Stats ---
    const totalLivestock = flocks.reduce((acc, f) => acc + (f.size || 0), 0);
    const pendingCount = treatments.filter(t => t.status === 'pending').length;
    const approvedCount = treatments.filter(t => t.status === 'approved').length;

    // Notifications logic: Vet directives + Approved/Rejected operator requests
    const operatorNotifications = treatments.filter(t => t.status === 'approved' || t.status === 'rejected');
    const allNotifications = [...vetDirectives, ...operatorNotifications].sort((a, b) => new Date(b.date) - new Date(a.date));

    const unreadDirectivesCount = allNotifications.filter(d => !readDirectives.includes(d.id)).length;

    const markAsRead = (id) => {
        if (!readDirectives.includes(id)) {
            const updated = [...readDirectives, id];
            setReadDirectives(updated);
            localStorage.setItem('readDirectives', JSON.stringify(updated));
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        setShowNotifications(false);
        setActiveTab('treatments');

        // Highlight logic
        setHighlightedTreatmentId(notification.id);
        setTimeout(() => setHighlightedTreatmentId(null), 5000); // Clear highlight after 5s
    };

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
                            {
                                header: 'Safety Status',
                                render: (row) => (
                                    <div className="flex flex-col gap-1">
                                        {row.is_under_withdrawal ? (
                                            <>
                                                <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded border border-rose-500/20 font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                                    <AlertCircle size={10} />
                                                    Quarantine
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                                    Safe: {new Date(row.safe_harvest_date).toLocaleDateString()}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                                <CheckCircle size={10} />
                                                Cleared
                                            </span>
                                        )}
                                    </div>
                                )
                            },
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
                    <div className="space-y-8 animate-fade-in">
                        {/* Vet Directives Section */}
                        {vetDirectives.length > 0 && (
                            <div className="bg-teal-accent/5 rounded-2xl border border-teal-accent/20 overflow-hidden shadow-lg shadow-teal-accent/5">
                                <div className="p-6 border-b border-teal-accent/20 flex justify-between items-center bg-teal-accent/10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-teal-accent text-[#14171a] p-2 rounded-xl">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                                Veterinarian Prescriptions (Direct)
                                            </h3>
                                            <p className="text-[11px] text-teal-accent/70 uppercase tracking-widest font-medium mt-0.5">Treatments ordered directly by vets for your farms</p>
                                        </div>
                                    </div>
                                </div>
                                <SearchableTable
                                    title=""
                                    data={vetDirectives}
                                    highlightRowId={highlightedTreatmentId}
                                    searchPlaceholder="Search directives..."
                                    columns={[
                                        {
                                            header: 'Farm & Target',
                                            render: (row) => (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-medium text-sm">{row.farm__name}</span>
                                                    {row.animal__animal_tag ? (
                                                        <span className="text-[10px] text-teal-accent font-bold uppercase tracking-wider">Animal: {row.animal__animal_tag}</span>
                                                    ) : row.flock__flock_tag ? (
                                                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Flock: {row.flock__flock_tag}</span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">Whole Farm</span>
                                                    )}
                                                </div>
                                            )
                                        },
                                        {
                                            header: 'Antibiotic & Dosage',
                                            render: (row) => (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-medium text-sm">{row.antibiotic_name}</span>
                                                    {(row.dosage || row.method_intake) && (
                                                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                            {row.dosage && <span className="bg-teal-accent/10 text-teal-accent text-[9px] px-1.5 py-0.5 rounded border border-teal-accent/20 uppercase font-medium">{row.dosage}</span>}
                                                            {row.method_intake && <span className="bg-white/5 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border border-white/10 uppercase font-medium">{row.method_intake}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        },
                                        {
                                            header: 'Instructions',
                                            render: (row) => (
                                                <div className="flex flex-col gap-2 items-start">
                                                    <span className="capitalize text-slate-300 text-xs font-medium">For: {row.treated_for}</span>
                                                    {row.vet_notes && (
                                                        <button
                                                            onClick={() => {
                                                                markAsRead(row.id);
                                                                setSelectedNotes({
                                                                    antibiotic: row.antibiotic_name,
                                                                    notes: row.vet_notes,
                                                                    date: row.date,
                                                                    status: row.status
                                                                })
                                                            }}
                                                            className="flex items-center gap-1.5 text-teal-accent hover:text-white mt-1 px-2 py-1 bg-teal-accent/10 hover:bg-teal-accent/20 rounded-md border border-teal-accent/20 transition-colors"
                                                        >
                                                            <FileText size={12} />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Read Full Instructions</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        },
                                        { header: 'Date', accessor: 'date' }
                                    ]}
                                />
                            </div>
                        )}

                        {/* Standard Treatment Logs */}
                        <div className="bg-surface-card rounded-2xl border border-white/5 overflow-hidden shadow-sm">
                            <SearchableTable
                                title="Your Requested Treatment Logs"
                                data={treatments}
                                highlightRowId={highlightedTreatmentId}
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
                                    {
                                        header: 'Antibiotic & Dosage',
                                        render: (row) => (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-medium text-sm">{row.antibiotic_name}</span>
                                                {(row.dosage || row.method_intake) && (
                                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                        {row.dosage && <span className="bg-teal-accent/10 text-teal-accent text-[9px] px-1.5 py-0.5 rounded border border-teal-accent/20 uppercase font-medium">{row.dosage}</span>}
                                                        {row.method_intake && <span className="bg-white/5 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border border-white/10 uppercase font-medium">{row.method_intake}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    },
                                    {
                                        header: 'Reason & Notes',
                                        render: (row) => (
                                            <div className="flex flex-col gap-2">
                                                <span className="capitalize text-slate-300 text-xs font-medium">{(row.reason || '').replace(/_/g, ' ')} / {row.treated_for}</span>
                                                {row.vet_notes && (
                                                    <button
                                                        onClick={() => setSelectedNotes({
                                                            antibiotic: row.antibiotic_name,
                                                            notes: row.vet_notes,
                                                            date: row.date,
                                                            status: row.status
                                                        })}
                                                        className="flex items-center gap-1.5 text-teal-accent hover:text-white mt-1 px-2 py-1 bg-teal-accent/10 hover:bg-teal-accent/20 rounded-md border border-teal-accent/20 transition-colors self-start"
                                                    >
                                                        <FileText size={12} />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">View Notes</span>
                                                    </button>
                                                )}
                                            </div>
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
                                        Log New Treatment
                                    </button>
                                }
                            />
                        </div>
                    </div>
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
                <header className="flex justify-between items-center mb-8 animate-slide-up relative z-50">
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

                    <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-2 bg-surface-card border border-white/5 rounded-xl px-4 py-2.5 text-slate-400">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-600 w-48 outline-none"
                            />
                        </div>

                        {/* Notification Bell */}
                        <div className="relative z-[100]">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2.5 bg-surface-card hover:bg-white/5 border border-white/5 text-slate-400 rounded-xl transition-colors relative"
                            >
                                <Bell size={18} />
                                {unreadDirectivesCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse">
                                        {unreadDirectivesCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-surface-card rounded-2xl border border-white/5 shadow-2xl overflow-hidden animate-fade-in origin-top-right">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-teal-accent/5">
                                        <h4 className="font-bold text-white text-sm">Inbox ({unreadDirectivesCount})</h4>
                                        <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white transition-colors">
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                                        {allNotifications.map((d, i) => {
                                            const isRead = readDirectives.includes(d.id);
                                            const isVetDirective = d.recorded_by__role === 'vet';
                                            return (
                                                <div key={i} className={`p-4 hover:bg-white/[0.04] transition-colors group cursor-pointer ${isRead ? 'opacity-60' : 'bg-teal-accent/5'}`} onClick={() => handleNotificationClick(d)}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-xs font-bold transition-colors ${isRead ? 'text-slate-300' : 'text-white group-hover:text-teal-accent'}`}>
                                                            {d.farm__name}
                                                        </span>
                                                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                                                            {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-teal-accent" />}
                                                            {d.date}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[10px] uppercase tracking-widest font-medium mb-1 ${isRead ? 'text-slate-500' : (d.status === 'rejected' ? 'text-rose-400' : 'text-teal-accent/80')}`}>
                                                        {isVetDirective ? 'New Vet Prescription' : `Request ${d.status}:`} {d.antibiotic_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 line-clamp-2 italic">{d.vet_notes || 'No extra notes provided.'}</p>
                                                </div>
                                            );
                                        })}
                                        {allNotifications.length === 0 && (
                                            <div className="p-6 text-center text-slate-500 text-sm">
                                                <Bell className="mx-auto mb-2 opacity-20" size={24} />
                                                No new messages
                                            </div>
                                        )}
                                    </div>
                                    {allNotifications.length > 0 && (
                                        <div className="p-3 border-t border-white/5 bg-black/20 text-center">
                                            <button onClick={() => { setActiveTab('treatments'); setShowNotifications(false); }} className="text-[10px] text-teal-accent font-bold uppercase tracking-widest hover:underline">
                                                View All in Treatments
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
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

                {/* Vet Notes Modal */}
                {selectedNotes && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-surface-card w-full max-w-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-teal-accent/5">
                                <div className="flex flex-col">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <FileText size={18} className="text-teal-accent" />
                                        Veterinarian Notes
                                    </h3>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{selectedNotes.antibiotic} • {selectedNotes.date}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedNotes(null)}
                                    className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedNotes.notes}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
                                <button
                                    onClick={() => setSelectedNotes(null)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OperatorDashboard;
