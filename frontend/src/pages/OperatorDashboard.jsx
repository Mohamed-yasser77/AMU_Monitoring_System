import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/operator/Sidebar';
import SearchableTable from '../components/operator/SearchableTable';
import FarmForm from '../components/operator/FarmForm';
import { Plus, LayoutGrid, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

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

            if (oRes.ok) setOwners(await oRes.json());
            if (fRes.ok) setFarms(await fRes.json());
            if (flRes.ok) setFlocks(await flRes.json());
            if (tRes.ok) setTreatments(await tRes.json());
            if (pRes.ok) setProblems(await pRes.json());
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
                        title="Managed Owners"
                        data={owners}
                        searchPlaceholder="Search by name, phone, or location..."
                        columns={[
                            { header: 'Name', accessor: 'name' },
                            { header: 'Email', accessor: 'email' },
                            { header: 'Phone', accessor: 'phone_number' },
                            {
                                header: 'Farms',
                                render: (row) => (
                                    <div className="flex flex-wrap gap-1">
                                        {row.farms?.map((farm, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold">
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
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
                            >
                                <Plus size={18} /> Add Farm/Owner
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
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userName={user?.name}
                onLogout={handleLogout}
            />

            <main className="flex-1 ml-64 p-8 transition-all duration-300">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Operator Dashboard</h1>
                        <p className="text-slate-500 font-medium">Monitoring stewardship across {farms.length} farms</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
                                <p className="text-xl font-black text-slate-900">{treatments.filter(t => t.status === 'pending').length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Approved</p>
                                <p className="text-xl font-black text-slate-900">{treatments.filter(t => t.status === 'approved').length}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {showFarmForm ? (
                    <FarmForm
                        userEmail={user?.email}
                        owners={owners}
                        onCancel={() => setShowFarmForm(false)}
                        onSuccess={() => {
                            setShowFarmForm(false);
                            fetchData();
                        }}
                    />
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {renderContent()}
                    </div>
                )}
            </main>
        </div>
    );
};

export default OperatorDashboard;
