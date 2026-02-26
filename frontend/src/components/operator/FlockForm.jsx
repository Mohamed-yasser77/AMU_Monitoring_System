import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, X, Layers, Activity } from 'lucide-react';

const inputClass = "w-full rounded-lg bg-[#14171a] border border-white/10 text-slate-200 placeholder:text-slate-600 py-3.5 px-4 text-sm focus:outline-none focus:border-[#00c096]/40 focus:ring-2 focus:ring-[#00c096]/10 transition-all";
const labelClass = "block text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2";

const speciesMapping = {
    'AVI': 'Avian (Poultry)',
    'BOV': 'Bovine (Cattle)',
    'SUI': 'Suine (Pigs)',
    'CAP': 'Caprine (Goats)',
    'OVI': 'Ovine (Sheep)',
    'EQU': 'Equine (Horses)',
    'LEP': 'Leporine (Rabbits)',
    'PIS': 'Pisces (Fish)',
    'CAM': 'Camelids (Camels)',
    'API': 'Apiculture (Bees)',
    'MIX': 'Mixed (Multi-species)'
};

const FlockForm = ({ onCancel, onSuccess, farms, userEmail }) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const [formData, setFormData] = useState({
        farm_id: farms.length > 0 ? farms[0].id : '',
        flock_code: '',
        species_type: 'AVI',
        count: '',
        age_in_weeks: '',
        avg_weight: '',
        avg_feed_consumption: '',
        avg_water_consumption: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // Find associated owner for the selected farm
        const selectedFarm = farms.find(f => f.id == formData.farm_id);
        if (!selectedFarm) {
            setError('Please select a valid farm');
            setSaving(false);
            return;
        }

        const payload = {
            email: userEmail,
            farm_id: Number(formData.farm_id),
            owner_id: selectedFarm.owner_id, // Farm must be associated with an owner on backend
            flock_code: formData.flock_code,
            species_type: formData.species_type,
            count: Number(formData.count),
            age_in_weeks: formData.age_in_weeks ? Number(formData.age_in_weeks) : null,
            avg_weight: Number(formData.avg_weight) || 0,
            avg_feed_consumption: Number(formData.avg_feed_consumption) || 0,
            avg_water_consumption: Number(formData.avg_water_consumption) || 0
        };

        try {
            const response = await fetch('http://localhost:8000/api/flocks/bulk/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessData(data);
                setTimeout(() => {
                    onSuccess();
                }, 2500);
            } else {
                setError(data.error || 'Failed to create flock');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (successData) {
        return (
            <div className="bg-[#1c2025] rounded-xl p-12 text-center border border-[#00c096]/20 shadow-2xl animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-[#00c096]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#00c096]/20 teal-glow">
                    <CheckCircle2 size={40} className="text-[#00c096]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Flock Registered!</h2>
                <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                    {successData.animals_created} animals auto-tagged from <br />
                    <span className="text-[#00c096] font-mono mt-2 block">{successData.tag_range}</span>
                </p>
                <div className="flex justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00c096] animate-pulse delay-150" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1c2025] rounded-xl p-8 max-w-2xl mx-auto border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00c096]/10 rounded-lg border border-[#00c096]/20">
                        <Layers size={20} className="text-[#00c096]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Bulk Flock Entry</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Automated Animal Tagging</p>
                    </div>
                </div>
                <button onClick={onCancel} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className={labelClass}>Select Farm (Mandatory)</label>
                        <select
                            name="farm_id"
                            value={formData.farm_id}
                            onChange={handleChange}
                            required
                            className={inputClass + " appearance-none"}
                        >
                            <option value="">— Select a Farm —</option>
                            {farms.map(f => (
                                <option key={f.id} value={f.id} className="bg-[#1c2025]">
                                    {f.name} ({f.farm_number})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Flock Code</label>
                        <input
                            name="flock_code"
                            placeholder="e.g. FLK01"
                            value={formData.flock_code}
                            onChange={handleChange}
                            required
                            className={inputClass}
                            maxLength={10}
                        />
                        <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-tighter italic">Used in animal tags: FRM123-FLK01-001</p>
                    </div>

                    <div>
                        <label className={labelClass}>Species Type</label>
                        <select
                            name="species_type"
                            value={formData.species_type}
                            onChange={handleChange}
                            required
                            className={inputClass + " appearance-none"}
                        >
                            {Object.entries(speciesMapping).map(([code, name]) => (
                                <option key={code} value={code} className="bg-[#1c2025]">{name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Number of Animals</label>
                        <input
                            name="count"
                            type="number"
                            placeholder="e.g. 500"
                            value={formData.count}
                            onChange={handleChange}
                            required
                            className={inputClass}
                            min="1"
                            max="10000"
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Age (Weeks)</label>
                        <input
                            name="age_in_weeks"
                            type="number"
                            placeholder="Optional"
                            value={formData.age_in_weeks}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>

                    <div className="col-span-2 border-t border-white/5 pt-5 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={12} className="text-[#00c096]" />
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth & Consumption Metrics</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Avg Weight (kg)</label>
                                <input
                                    name="avg_weight"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.avg_weight}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Feed (kg/day)</label>
                                <input
                                    name="avg_feed_consumption"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.avg_feed_consumption}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Water (L/day)</label>
                                <input
                                    name="avg_water_consumption"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.avg_water_consumption}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg flex items-center gap-3 text-sm animate-in shake duration-300">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 bg-white/5 text-slate-400 py-3.5 rounded-lg font-medium text-sm hover:bg-white/10 hover:text-white transition-all border border-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] bg-[#00c096] text-[#14171a] py-3.5 px-8 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-[#00d4a6] transition-all disabled:opacity-40 flex items-center justify-center gap-2 teal-glow"
                    >
                        {saving ? 'Registering...' : <><CheckCircle2 size={18} /> Register Flock & Tags</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FlockForm;
