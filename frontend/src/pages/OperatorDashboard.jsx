import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/operator/Sidebar';
import SearchableTable from '../components/operator/SearchableTable';
import FarmForm from '../components/operator/FarmForm';
import { Plus, LayoutGrid, Clock, AlertTriangle, CheckCircle, Users, Home, Activity } from 'lucide-react';

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

const OperatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('owners');
    const [owners, setOwners] = useState([]);
    const [farms, setFarms] = useState([]);
    const [flocks, setFlocks] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFarmForm, setShowFarmForm] = useState(false);

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
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'data_operator' && user.role !== 'farmer') {
            navigate('/login');
            return;
        }
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'owners':
                return (
                    <SearchableTable
                        title="Owner Portfolio"
                        data={owners}
                        searchPlaceholder="Find owner by name, email, or contact..."
                        columns={[
                            { header: 'Name', accessor: 'name' },
                            { header: 'Email', accessor: 'email' },
                            { header: 'Phone', accessor: 'phone_number' },
                            {
                                header: 'Farms Managed',
                                render: (row) => (
                                    <div className="flex flex-wrap gap-2">
                                        {row.farms?.map((farm, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-indigo-50 text-[#4f46e5] rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100/50 shadow-sm">
                                                {farm}
                                            </span>
                                        ))}
                                    </div>
                                )
                            }
                        ]}
                        actions={
                            <button
                                onClick={() => setShowFarmForm(true)}
                                className="px-6 py-3.5 bg-[#4f46e5] text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-[#4338ca] hover:shadow-xl hover:shadow-[#4f46e5]/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} strokeWidth={3} />
                                Register New Enterprise
                            </button>
                        }
                    />
                );
            case 'farms':
                return (
                    <SearchableTable
                        title="Managed Farms"
                        data={farms}
                        columns={[
                            { header: 'Farm Name', accessor: 'name' },
                            { header: 'Reg Number', accessor: 'farm_number' },
                            { header: 'Species', render: (row) => speciesMapping[row.species_type] || row.species_type },
                            { header: 'Type', render: (row) => <span className="capitalize px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600">{row.farm_type}</span> },
                            { header: 'Animals', accessor: 'total_animals' }
                        ]}
                    />
                );
            case 'flocks':
                return (
                    <SearchableTable
                        title="Managed Flocks"
                        data={flocks}
                        columns={[
                            { header: 'Flock Tag', accessor: 'flock_tag' },
                            { header: 'Species', render: (row) => speciesMapping[row.species_type] || row.species_type },
                            { header: 'Size', accessor: 'size' },
                            { header: 'Age (Weeks)', accessor: 'age_in_weeks' },
                            { header: 'Farm ID', accessor: 'farm_id' }
                        ]}
                    />
                );
            case 'treatments':
                return (
                    <SearchableTable
                        title="Treatment Logs"
                        data={treatments}
                        columns={[
                            { header: 'Farm', render: (row) => <div className="font-bold">{row.farm__name} <br /><span className="text-[10px] text-slate-400 font-normal">{row.farm__farm_number}</span></div> },
                            { header: 'Antibiotic', accessor: 'antibiotic_name' },
                            { header: 'Reason', render: (row) => <span className="capitalize">{row.reason.replace('_', ' ')}</span> },
                            { header: 'Date', accessor: 'date' },
                            {
                                header: 'Status', render: (row) => {
                                    const colors = {
                                        'pending': 'bg-amber-100 text-amber-700 ring-amber-200',
                                        'approved': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
                                        'rejected': 'bg-rose-100 text-rose-700 ring-rose-200'
                                    };
                                    return (
                                        <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black ring-1 ring-inset ${colors[row.status] || colors.pending}`}>
                                            {row.status || 'Pending'}
                                        </span>
                                    );
                                }
                            }
                        ]}
                    />
                );
            case 'problems':
                return (
                    <SearchableTable
                        title="Health Issues"
                        data={problems}
                        columns={[
                            { header: 'Description', accessor: 'description' },
                            {
                                header: 'Severity', render: (row) => {
                                    const colors = {
                                        'low': 'bg-blue-100 text-blue-700',
                                        'medium': 'bg-orange-100 text-orange-700',
                                        'high': 'bg-red-100 text-red-700'
                                    };
                                    return <span className={`capitalize px-2 py-1 rounded-md text-xs font-bold ${colors[row.severity]}`}>{row.severity}</span>;
                                }
                            },
                            { header: 'Reported', accessor: 'date_reported' }
                        ]}
                    />
                );
            default:
                return null;
        }
    };

    if (loading && !owners.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={user?.name} onLogout={handleLogout} />

            <main className="flex-1 ml-64 p-10 animate-fade-in custom-scrollbar overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-12 animate-slide-up">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Operator <span className="text-[#4f46e5]">Console</span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]/20" />
                            <span className="text-[10px] font-black text-[#4f46e5] uppercase tracking-[0.2em]">{activeTab}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3 transition-all cursor-default">
                            <div className="w-2 h-2 rounded-full bg-[#4f46e5] animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">System Live</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Owners', value: owners.length, icon: Users, color: 'text-[#4f46e5]', bg: 'bg-[#4f46e5]/5', border: 'border-indigo-100/50', delay: '0ms' },
                        { label: 'Active Farms', value: farms.length, icon: Home, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', delay: '100ms' },
                        { label: 'Total Flocks', value: flocks.length, icon: LayoutGrid, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', delay: '200ms' },
                        { label: 'Pending Logs', value: treatments.filter(t => t.status === 'pending').length, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50/50', border: 'border-rose-100/50', delay: '300ms' },
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500 animate-slide-up"
                            style={{ animationDelay: stat.delay }}
                        >
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                    <stat.icon size={22} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</h3>
                                </div>
                            </div>
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat.bg} opacity-20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150`} />
                        </div>
                    ))}
                </div>

                <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                    {renderContent()}
                </div>

                {showFarmForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl overflow-hidden">
                            <FarmForm
                                onCancel={() => setShowFarmForm(false)}
                                onSuccess={() => {
                                    setShowFarmForm(false);
                                    fetchData();
                                }}
                                owners={owners}
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
