import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Beaker, Calendar, ClipboardList, CheckCircle2, AlertCircle, ArrowLeft, ChevronRight, Layers, Tag as TagIcon } from 'lucide-react';
import api from '../services/api';

const LogTreatment = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('operatorTheme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('operatorTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const inputClass = `w-full rounded-2xl border py-4 px-5 text-sm font-bold transition-all outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5' : 'bg-slate-50 border-slate-100 text-slate-700 placeholder:text-slate-300 focus:border-primary-200 focus:ring-4 focus:ring-primary-500/5'}`;
  const labelClass = `block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`;

  // ... (keeping state and useEffects as they are logic-heavy)
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

  useEffect(() => {
    if (!user || (user.role !== 'data_operator' && user.role !== 'farmer')) {
      navigate('/login');
      return;
    }

    const fetchFarms = async () => {
      try {
        const data = await api.get('/farms/');
        setFarms(data);
        if (data.length > 0 && !formData.farm) {
          setFormData(prev => ({ ...prev, farm: data[0].id.toString() }));
        }
      } catch (err) {
        console.error('Error fetching farms:', err);
        setError('Failed to load farms');
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [navigate, user?.email]);

  useEffect(() => {
    if (formData.farm) {
      setFlocks([]);
      setFormData(prev => ({ ...prev, flock_id: '', animal_id: '' }));
      api.get(`/flocks/?farm_id=${formData.farm}`)
        .then(data => {
          if (Array.isArray(data)) {
            setFlocks(data);
          }
        })
        .catch(err => console.error('Error fetching flocks:', err));
    }
  }, [formData.farm, user?.email]);

  useEffect(() => {
    if (formData.flock_id) {
      setAnimals([]);
      setFormData(prev => ({ ...prev, animal_id: '' }));
      api.get(`/animals/?flock_id=${formData.flock_id}`)
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
      api.get(`/reference/molecules/?species=${species}`)
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
      farm: Number(formData.farm),
      flock_id: formData.flock_id ? Number(formData.flock_id) : null,
      animal_id: formData.animal_id ? Number(formData.animal_id) : null
    };

    try {
      await api.post('/treatments/', payload);
      setSuccess(true);
      setTimeout(() => navigate('/operator-dashboard'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to log treatment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#01050a]' : 'bg-slate-50'} flex items-center justify-center transition-colors duration-500`}>
      <div className="flex flex-col items-center gap-4">
        <div className={`animate-spin rounded-full h-10 w-10 border-t-2 ${darkMode ? 'border-teal-500 border-white/10' : 'border-primary-600 border-slate-200'}`}></div>
        <p className={`${darkMode ? 'text-slate-500' : 'text-slate-400'} text-[10px] font-black uppercase tracking-widest`}>Accessing Medical Database...</p>
      </div>
    </div>
  );

  if (success) return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#01050a]' : 'bg-slate-50'} flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className={`${darkMode ? 'bg-[#020b17] border-white/5 shadow-none' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/50'} rounded-3xl p-12 text-center border animate-enter`}>
        <div className={`w-24 h-24 ${darkMode ? 'bg-teal-500/10' : 'bg-primary-50'} rounded-3xl flex items-center justify-center mx-auto mb-8 border ${darkMode ? 'border-teal-500/20' : 'border-primary-100'}`}>
          <CheckCircle2 size={48} className={darkMode ? 'text-teal-400' : 'text-primary-600'} />
        </div>
        <h2 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Log Recorded</h2>
        <p className={`${darkMode ? 'text-slate-500' : 'text-slate-400'} text-[10px] font-black mb-8 uppercase tracking-[0.25em]`}>Audit Registry Updated Successfully</p>
        <div className="flex justify-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-teal-500' : 'bg-primary-600'} animate-bounce`} />
          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-teal-500' : 'bg-primary-600'} animate-bounce delay-75`} />
          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-teal-500' : 'bg-primary-600'} animate-bounce delay-150`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`h-screen overflow-y-auto custom-scrollbar ${darkMode ? 'bg-[#01050a]' : 'bg-slate-50'} py-16 px-6 transition-colors duration-500 overflow-x-hidden`}>
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-12 animate-slide-up pb-24">

        {/* Info Panel */}
        <div className="space-y-8">
          <button
            onClick={() => navigate('/operator-dashboard')}
            className={`flex items-center gap-3 transition-all text-[10px] font-black uppercase tracking-[0.2em] group ${darkMode ? 'text-slate-500 hover:text-teal-400' : 'text-slate-400 hover:text-primary-600'}`}
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Overview
          </button>

          <div className={`${darkMode ? 'bg-[#020b17] border-white/5 shadow-none' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/30'} rounded-3xl p-10 border relative overflow-hidden transition-all duration-300`}>
            <div className="relative z-10">
              <div className={`w-12 h-12 ${darkMode ? 'bg-teal-600' : 'bg-primary-600'} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg ${darkMode ? 'shadow-teal-500/20' : 'shadow-primary-500/20'}`}>
                <Activity size={24} />
              </div>
              <h2 className={`text-2xl font-black tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Treatment Protocol</h2>
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm font-bold leading-relaxed mb-10`}>
                Maintain high transparency by logging medical intervention at every production level.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 border ${darkMode ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-primary-50 text-primary-600 border-primary-100'}`}>
                    <Layers size={16} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>Target Scope</p>
                    <p className={`text-[10px] font-bold leading-normal uppercase tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Farm, Flock, or Individual Entity</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 border ${darkMode ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                    <Beaker size={16} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>Drug Validation</p>
                    <p className={`text-[10px] font-bold leading-normal uppercase tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Species-specific molecule matching</p>
                  </div>
                </div>
              </div>
            </div>
            <Activity size={200} className={`absolute -right-16 -bottom-16 opacity-[0.03] rotate-12 ${darkMode ? 'text-teal-500' : 'text-primary-900'}`} />
          </div>

          <div className={`${darkMode ? 'bg-[#020b17] border-white/5 shadow-none' : 'bg-white border-slate-100 shadow-sm'} rounded-3xl p-8 border flex items-center gap-5 transition-all duration-300`}>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${darkMode ? 'bg-white/5 border-white/5 text-slate-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
              <ClipboardList size={24} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Session Volume</p>
              <p className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Active Protocol</p>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className={`lg:col-span-2 ${darkMode ? 'bg-[#020b17] border-white/5 shadow-none' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/40'} rounded-[3rem] p-12 lg:p-14 border transition-all duration-300`}>
          <form onSubmit={handleSubmit} className="space-y-12">

            {/* 1. Target Selection */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'bg-primary-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'}`} />
                <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>Identity Matrix</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className={labelClass}>Production Center</label>
                  <select name="farm" value={formData.farm} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Select a farm</option>
                    {farms.map(f => <option key={f.id} value={f.id} className={darkMode ? 'bg-[#1a1f2e]' : ''}>{f.name} ({f.farm_number})</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Flock Reference</label>
                  <div className="relative group/select">
                    <select
                      name="flock_id"
                      value={formData.flock_id}
                      onChange={handleChange}
                      className={inputClass + ` appearance-none ${!formData.farm ? 'opacity-40 cursor-not-allowed' : ''}`}
                      disabled={!formData.farm}
                    >
                      <option value="" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Global (All Flocks)</option>
                      {flocks.map(f => <option key={f.id} value={f.id} className={darkMode ? 'bg-[#1a1f2e]' : ''}>{f.flock_tag} ({f.size} animals)</option>)}
                    </select>
                    <ChevronRight size={18} className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${darkMode ? 'text-slate-600 group-focus-within/select:text-teal-400' : 'text-slate-300 group-focus-within/select:text-primary-600'}`} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Serial ID</label>
                  <div className="relative group/select">
                    <select
                      name="animal_id"
                      value={formData.animal_id}
                      onChange={handleChange}
                      className={inputClass + ` appearance-none ${!formData.flock_id ? 'opacity-40 cursor-not-allowed' : ''}`}
                      disabled={!formData.flock_id}
                    >
                      <option value="" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Batch Management</option>
                      {animals.map(a => <option key={a.id} value={a.id} className={darkMode ? 'bg-[#1a1f2e]' : ''}>{a.animal_tag}</option>)}
                    </select>
                    <TagIcon size={18} className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${darkMode ? 'text-slate-600 group-focus-within/select:text-teal-400' : 'text-slate-300 group-focus-within/select:text-primary-600'}`} />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Treatment Details */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'bg-primary-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'}`} />
                <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>Treatment Profile</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className={labelClass}>Medical Compound</label>
                  <select name="antibiotic_name" value={formData.antibiotic_name} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Select molecule...</option>
                    {antibiotics.map(a => <option key={a.id} value={a.name} className={darkMode ? 'bg-[#1a1f2e]' : ''}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Clinical Intent</label>
                  <select name="reason" value={formData.reason} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Select intent</option>
                    <option value="treat_disease" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Curative (Disease Treatment)</option>
                    <option value="prophylactic" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Preventative (Prophylactic)</option>
                    <option value="other" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Specified Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Pathological Category</label>
                  <select name="treated_for" value={formData.treated_for} onChange={handleChange} required className={inputClass + " appearance-none"}>
                    <option value="" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Select pathology</option>
                    <option value="enteric" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Enteric Syndrome</option>
                    <option value="respiratory" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Respiratory Infection</option>
                    <option value="reproductive" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Reproductive Disorder</option>
                    <option value="other" className={darkMode ? 'bg-[#1a1f2e]' : ''}>Others</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Administration Date</label>
                  <div className="relative group">
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                    <Calendar size={18} className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-teal-400' : 'text-slate-300 group-focus-within:text-primary-600'}`} />
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className={`p-6 border rounded-2xl flex items-center gap-4 text-sm font-bold animate-fade-in ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-rose-500/20' : 'bg-rose-100'}`}>
                  <AlertCircle size={18} />
                </div>
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-5 pt-6">
              <button
                type="button"
                onClick={() => navigate('/operator-dashboard')}
                className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${darkMode ? 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-400' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:text-slate-600'}`}
              >
                Discard Entry
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] transition-all disabled:opacity-40 flex items-center justify-center gap-4 shadow-xl group/submit ${darkMode ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-teal-500/25' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/25'}`}
              >
                {saving ? 'Processing Entry...' : <><Activity size={18} className="group-hover/submit:scale-125 transition-transform" /> Finalize Registry Log</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogTreatment;
