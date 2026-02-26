import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Beaker, Calendar, ClipboardList, CheckCircle2, AlertCircle, ArrowLeft, ChevronRight, Layers, Tag as TagIcon } from 'lucide-react';

const inputClass = "w-full rounded-lg bg-[#14171a] border border-white/10 text-slate-200 placeholder:text-slate-600 py-3.5 px-4 text-sm focus:outline-none focus:border-[#00c096]/40 focus:ring-2 focus:ring-[#00c096]/10 transition-all";
const labelClass = "block text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2";

const LogTreatment = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));

  // --- State ---
  const [farms, setFarms] = useState([]);
  const [flocks, setFlocks] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [antibiotics, setAntibiotics] = useState([]);

  const [formData, setFormData] = useState({
    farm: '',
    flock_id: '',
    animal_id: '',
    antibiotic_name: '',
    reason: '',
    treated_for: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    if (!user || (user.role !== 'data_operator' && user.role !== 'farmer')) {
      navigate('/login');
      return;
    }

    const fetchFarms = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/farms/?email=${user.email}`);
        if (response.ok) {
          const data = await response.json();
          setFarms(data);
          // Only set default farm if none is currently selected to avoid selection reset glitch
          if (data.length > 0 && !formData.farm) {
            setFormData(prev => ({ ...prev, farm: data[0].id.toString() }));
          }
        }
      } catch (err) {
        console.error('Error fetching farms:', err);
        setError('Failed to load farms');
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [navigate, user?.email]); // Depend on email string, not object

  // Fetch Flocks when Farm changes
  useEffect(() => {
    if (formData.farm) {
      setFlocks([]);
      // Clear dependent fields when farm selection changes
      setFormData(prev => ({ ...prev, flock_id: '', animal_id: '' }));

      // Use standard flocks endpoint for authenticated user filtering
      fetch(`http://localhost:8000/api/flocks/?email=${user.email}&farm_id=${formData.farm}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFlocks(data);
          }
        })
        .catch(err => console.error('Error fetching flocks:', err));
    }
  }, [formData.farm, user?.email]);

  // Fetch Animals when Flock changes
  useEffect(() => {
    if (formData.flock_id) {
      setAnimals([]);
      setFormData(prev => ({ ...prev, animal_id: '' }));

      // Note: We need a way to list animals for a flock. 
      // The backend has AnimalListCreateView that accepts flock_id
      fetch(`http://localhost:8000/api/animals/?email=${user.email}&flock_id=${formData.flock_id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAnimals(data);
          }
        })
        .catch(err => console.error('Error fetching animals:', err));
    } else {
      setAnimals([]);
    }
  }, [formData.flock_id, user?.email]);

  // Fetch Antibiotics based on selected level's species
  useEffect(() => {
    let species = '';
    if (formData.flock_id) {
      const selectedFlock = flocks.find(f => f.id == formData.flock_id);
      species = selectedFlock?.species_type || '';
    } else if (formData.farm) {
      const selectedFarm = farms.find(f => f.id == formData.farm);
      species = selectedFarm?.species_type || '';
    }

    if (species) {
      fetch(`http://localhost:8000/api/reference/molecules/?species=${species}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAntibiotics(data);
          } else {
            setAntibiotics([]);
          }
        })
        .catch(err => console.error('Error fetching molecules:', err));
    } else {
      setAntibiotics([]);
    }
  }, [formData.farm, formData.flock_id, farms, flocks]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...formData,
      email: user.email,
      // Convert strings to numbers for IDs
      farm: Number(formData.farm),
      flock_id: formData.flock_id ? Number(formData.flock_id) : null,
      animal_id: formData.animal_id ? Number(formData.animal_id) : null
    };

    try {
      const response = await fetch('http://localhost:8000/api/treatments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/operator-dashboard'), 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to log treatment');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f1113] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00c096]"></div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-[#0f1113] flex items-center justify-center p-4">
      <div className="bg-[#1c2025] rounded-xl p-12 text-center border border-[#00c096]/20 shadow-2xl animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-[#00c096]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#00c096]/20 teal-glow">
          <CheckCircle2 size={40} className="text-[#00c096]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Treatment Logged!</h2>
        <p className="text-slate-400 text-sm mb-6 uppercase tracking-widest">Compliance Updated</p>
        <div className="flex justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-pulse delay-75" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1113] text-slate-200 py-12 px-4 flex justify-center items-start overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl w-full grid grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Info Panel */}
        <div className="space-y-6">
          <button
            onClick={() => navigate('/operator-dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>

          <div className="bg-[#1c2025] rounded-xl p-8 border border-white/5 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-4">Log Treatment</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Register antibiotic use at the farm, flock, or individual animal level to maintain AMU compliance.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-teal-accent/10 rounded-lg text-teal-accent shrink-0">
                    <Layers size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Granularity</p>
                    <p className="text-[10px] text-slate-500 leading-normal">System supports 3 levels of targeting for precise regulation.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                    <Beaker size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Reference Check</p>
                    <p className="text-[10px] text-slate-500 leading-normal">Antibiotics are filtered by species to ensure valid prescriptions.</p>
                  </div>
                </div>
              </div>
            </div>
            <Activity size={180} className="absolute -right-12 -bottom-12 opacity-[0.03] text-white rotate-12" />
          </div>

          <div className="bg-[#00c096]/5 rounded-xl p-6 border border-[#00c096]/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#00c096] flex items-center justify-center text-[#14171a] shadow-lg shadow-[#00c096]/20">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Logged Today</p>
              <p className="text-lg font-bold text-white">4 Sessions</p>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="col-span-2 bg-[#1c2025] rounded-xl p-10 border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* 1. Target Selection */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-4 bg-[#00c096] rounded-full" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Target Identification</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className={labelClass}>Farm</label>
                  <select name="farm" value={formData.farm} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="">Select a farm</option>
                    {farms.map(f => <option key={f.id} value={f.id} className="bg-[#1c2025]">{f.name} ({f.farm_number})</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Flock (Optional)</label>
                  <div className="relative group">
                    <select
                      name="flock_id"
                      value={formData.flock_id}
                      onChange={handleChange}
                      className={inputClass + ` appearance-none ${!formData.farm ? 'opacity-30 cursor-not-allowed' : ''}`}
                      disabled={!formData.farm}
                    >
                      <option value="">Whole Farm (All Flocks)</option>
                      {flocks.map(f => <option key={f.id} value={f.id} className="bg-[#1c2025]">{f.flock_tag} ({f.size} animals)</option>)}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover:text-teal-accent transition-colors" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Individual Animal (Optional)</label>
                  <div className="relative group">
                    <select
                      name="animal_id"
                      value={formData.animal_id}
                      onChange={handleChange}
                      className={inputClass + ` appearance-none ${!formData.flock_id ? 'opacity-30 cursor-not-allowed' : ''}`}
                      disabled={!formData.flock_id}
                    >
                      <option value="">Whole Flock</option>
                      {animals.map(a => <option key={a.id} value={a.id} className="bg-[#1c2025]">{a.animal_tag}</option>)}
                    </select>
                    <TagIcon size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover:text-teal-accent transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Treatment Details */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-4 bg-[#00c096] rounded-full" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Medical Info</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className={labelClass}>Antibiotic Name</label>
                  <select name="antibiotic_name" value={formData.antibiotic_name} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="">Select antibiotic</option>
                    {antibiotics.map(a => <option key={a.id} value={a.name} className="bg-[#1c2025]">{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Reason</label>
                  <select name="reason" value={formData.reason} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="">Select reason</option>
                    <option value="treat_disease" className="bg-[#1c2025]">Treat Disease</option>
                    <option value="prophylactic" className="bg-[#1c2025]">Prophylactic</option>
                    <option value="other" className="bg-[#1c2025]">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Treated For</label>
                  <select name="treated_for" value={formData.treated_for} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="">Select condition</option>
                    <option value="enteric" className="bg-[#1c2025]">Enteric</option>
                    <option value="respiratory" className="bg-[#1c2025]">Respiratory</option>
                    <option value="reproductive" className="bg-[#1c2025]">Reproductive</option>
                    <option value="other" className="bg-[#1c2025]">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Treatment Date</label>
                  <div className="relative">
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                    <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg flex items-center gap-3 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/operator-dashboard')}
                className="flex-1 bg-white/5 text-slate-400 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] bg-[#00c096] text-[#14171a] py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#00d4a6] transition-all disabled:opacity-40 flex items-center justify-center gap-3 shadow-lg shadow-[#00c096]/10 teal-glow"
              >
                {saving ? 'LOGGING...' : <><Activity size={18} /> Submit Treatment Log</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogTreatment;
