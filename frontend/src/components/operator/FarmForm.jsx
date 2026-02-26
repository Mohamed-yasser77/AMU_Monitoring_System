import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, X } from 'lucide-react';

const inputClass = "w-full rounded-lg bg-[#14171a] border border-white/10 text-slate-200 placeholder:text-slate-600 py-3.5 px-4 text-sm focus:outline-none focus:border-[#00c096]/40 focus:ring-2 focus:ring-[#00c096]/10 transition-all";
const labelClass = "block text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2";

const FarmForm = ({ onCancel, onSuccess, owners, userEmail }) => {
    const [step, setStep] = useState(1);
    const [useExistingOwner, setUseExistingOwner] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        owner_id: '',
        owner_name: '',
        owner_email: '',
        owner_phone_number: '',
        owner_address: '',
        name: '',
        state: '',
        district: '',
        village: '',
        farm_number: '',
        farm_type: 'commercial',
        farm_type: 'commercial',
        species_type: 'MIX'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload = {
            email: userEmail,
            ...formData,
            total_animals: 0,
            avg_weight: 0,
            avg_feed_consumption: 0,
            avg_water_consumption: 0
        };

        if (useExistingOwner) {
            delete payload.owner_name;
            delete payload.owner_email;
            delete payload.owner_phone_number;
            delete payload.owner_address;
        } else {
            delete payload.owner_id;
        }

        try {
            const response = await fetch('http://localhost:8000/api/farms/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onSuccess();
            } else {
                const errData = await response.json();
                setError(errData.error || 'Failed to create farm');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[#1c2025] rounded-xl p-8 max-w-3xl mx-auto border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-accent/10 rounded-lg border border-teal-accent/20">
                        <Plus size={20} className="text-teal-accent" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Add New Farm</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Step {step} of 2 — {step === 1 ? 'Owner Info' : 'Farm Details'}</p>
                    </div>
                </div>
                <button onClick={onCancel} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                    <X size={18} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
                <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-teal-accent' : 'bg-white/5'}`} />
                <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-teal-accent' : 'bg-white/5'}`} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Toggle */}
                        <div>
                            <label className={labelClass}>Owner Type</label>
                            <div className="flex gap-2 p-1 bg-[#14171a] rounded-lg border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setUseExistingOwner(true)}
                                    className={`flex-1 py-2.5 rounded-md text-xs font-medium transition-all ${useExistingOwner ? 'bg-teal-accent/20 text-teal-accent border border-teal-accent/30' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Existing Owner
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUseExistingOwner(false)}
                                    className={`flex-1 py-2.5 rounded-md text-xs font-medium transition-all ${!useExistingOwner ? 'bg-teal-accent/20 text-teal-accent border border-teal-accent/30' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    New Owner
                                </button>
                            </div>
                        </div>

                        {useExistingOwner ? (
                            <div>
                                <label className={labelClass}>Select Owner</label>
                                <select
                                    name="owner_id"
                                    value={formData.owner_id}
                                    onChange={handleChange}
                                    required
                                    className={inputClass + " appearance-none"}
                                >
                                    <option value="" className="bg-[#1c2025]">— Select an Owner —</option>
                                    {owners.map(o => <option key={o.id} value={o.id} className="bg-[#1c2025]">{o.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Owner Name</label>
                                    <input name="owner_name" placeholder="Full name" onChange={handleChange} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Email (Optional)</label>
                                    <input name="owner_email" type="email" placeholder="email@example.com" onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <input name="owner_phone_number" placeholder="+91 XXX XXX XXXX" onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Address</label>
                                    <input name="owner_address" placeholder="Physical address" onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            disabled={useExistingOwner && !formData.owner_id}
                            className="w-full bg-[#00c096] text-[#14171a] py-3.5 rounded-lg font-bold text-sm hover:bg-[#00d4a6] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Continue to Farm Details →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Section: General */}
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-0.5 h-5 bg-teal-accent rounded-full" />
                                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-widest">General Information</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Farm Name</label>
                                    <input name="name" placeholder="e.g. Sunrise Poultry" onChange={handleChange} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Registration Number</label>
                                    <input name="farm_number" placeholder="e.g. FRM-2024-001" onChange={handleChange} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Farm Type</label>
                                    <select name="farm_type" value={formData.farm_type} onChange={handleChange} className={inputClass + " appearance-none"}>
                                        <option value="backyard" className="bg-[#1c2025]">Backyard</option>
                                        <option value="commercial" className="bg-[#1c2025]">Commercial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Primary Species (Optional)</label>
                                    <select name="species_type" value={formData.species_type} onChange={handleChange} className={inputClass + " appearance-none"}>
                                        <option value="MIX" className="bg-[#1c2025]">Mixed (Multi-species)</option>
                                        <option value="AVI" className="bg-[#1c2025]">Avian (Poultry)</option>
                                        <option value="BOV" className="bg-[#1c2025]">Bovine (Cattle)</option>
                                        <option value="SUI" className="bg-[#1c2025]">Suine (Pigs)</option>
                                        <option value="CAP" className="bg-[#1c2025]">Caprine (Goats)</option>
                                        <option value="OVI" className="bg-[#1c2025]">Ovine (Sheep)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section: Location */}
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-0.5 h-5 bg-teal-accent rounded-full" />
                                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-widest">Location</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>State</label>
                                    <input name="state" placeholder="e.g. Tamil Nadu" onChange={handleChange} required className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>District</label>
                                    <input name="district" placeholder="e.g. Coimbatore" onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Village / Area</label>
                                    <input name="village" placeholder="e.g. Sulur" onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 bg-white/5 text-slate-400 py-3.5 rounded-lg font-medium text-sm hover:bg-white/10 hover:text-white transition-all border border-white/5"
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] bg-[#00c096] text-[#14171a] py-3.5 px-8 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-[#00d4a6] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {saving ? 'Creating...' : <><CheckCircle2 size={18} /> Create Farm & Link Owner</>}
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg flex items-center gap-3 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
};

export default FarmForm;
