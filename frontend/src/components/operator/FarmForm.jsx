import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Home, CheckCircle2, AlertCircle } from 'lucide-react';

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
        species_type: 'AVI',
        total_animals: '',
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

        const payload = {
            email: userEmail,
            ...formData,
            total_animals: Number(formData.total_animals),
            avg_weight: Number(formData.avg_weight),
            avg_feed_consumption: Number(formData.avg_feed_consumption),
            avg_water_consumption: Number(formData.avg_water_consumption)
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
        <div className="bg-white rounded-3xl p-10 max-w-4xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                        <Plus size={24} className="text-[#4f46e5]" />
                    </div>
                    Add New Farm
                </h2>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-medium">Cancel</button>
            </div>

            <div className="flex gap-4 mb-8">
                <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-[#4f46e5]' : 'bg-slate-100'}`} />
                <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[#4f46e5]' : 'bg-slate-100'}`} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col gap-4">
                            <label className="text-sm font-bold text-slate-900">Owner Information</label>
                            <div className="flex gap-4 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setUseExistingOwner(true)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${useExistingOwner ? 'bg-white shadow-sm text-[#4f46e5]' : 'text-slate-400'}`}
                                >
                                    Existing Owner
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUseExistingOwner(false)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!useExistingOwner ? 'bg-white shadow-sm text-[#4f46e5]' : 'text-slate-400'}`}
                                >
                                    New Owner
                                </button>
                            </div>
                        </div>

                        {useExistingOwner ? (
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Owner</label>
                                    <select
                                        name="owner_id"
                                        value={formData.owner_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-[#97D3CD]/50 py-4 px-5 bg-white border-slate-200 focus:border-[#4f46e5]/30 focus:ring-4 focus:ring-[#4f46e5]/5 shadow-sm"
                                    >
                                        <option value="">Select an Owner</option>
                                        {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Name</label>
                                    <input name="owner_name" placeholder="Enter owner's full name" onChange={handleChange} required className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-[#97D3CD]/50 py-4 px-5 bg-slate-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Email</label>
                                    <input name="owner_email" type="email" placeholder="email@example.com (Optional)" onChange={handleChange} className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-[#97D3CD]/50 py-4 px-5 bg-slate-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                                    <input name="owner_phone_number" placeholder="+91 XXX XXX XXXX" onChange={handleChange} className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-[#97D3CD]/50 py-4 px-5 bg-slate-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Address</label>
                                    <textarea name="owner_address" placeholder="Complete address of the owner" onChange={handleChange} rows="3" className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-[#97D3CD]/50 py-4 px-5 bg-slate-50/50" />
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            disabled={useExistingOwner && !formData.owner_id}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            Continue to Farm Details
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 border-l-4 border-[#97D3CD] pl-3">General Information</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Name</label>
                                        <input name="name" placeholder="e.g. Sunrise Poultry" onChange={handleChange} required className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Number</label>
                                        <input name="farm_number" placeholder="e.g. FRM-2024-001" onChange={handleChange} required className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Type</label>
                                        <select name="farm_type" value={formData.farm_type} onChange={handleChange} className="w-full rounded-xl border-slate-200 py-4 px-5 bg-slate-50/50">
                                            <option value="backyard">Backyard</option>
                                            <option value="commercial">Commercial</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Species Category</label>
                                        <select name="species_type" value={formData.species_type} onChange={handleChange} className="w-full rounded-xl border-slate-200 py-4 px-5 bg-slate-50/50">
                                            <option value="AVI">Avian (Poultry)</option>
                                            <option value="BOV">Bovine (Cattle)</option>
                                            <option value="SUI">Suine (Pigs)</option>
                                            <option value="CAP">Caprine (Goats)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Animal Count</label>
                                        <input name="total_animals" type="number" placeholder="0" onChange={handleChange} required className="w-full rounded-xl border-slate-200 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 border-l-4 border-[#97D3CD] pl-3">Location Details</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                                        <input name="state" placeholder="e.g. Tamil Nadu" onChange={handleChange} required className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">District</label>
                                        <input name="district" placeholder="e.g. Coimbatore" onChange={handleChange} className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Village / Area</label>
                                        <input name="village" placeholder="e.g. Sulur" onChange={handleChange} className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 border-l-4 border-[#97D3CD] pl-3">Performance Metrics (Average)</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Body Weight (kg)</label>
                                        <input name="avg_weight" type="number" step="0.01" placeholder="0.00" onChange={handleChange} required className="w-full rounded-xl border-slate-200 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Feed Intake (kg/day)</label>
                                        <input name="avg_feed_consumption" type="number" step="0.01" placeholder="0.00" onChange={handleChange} required className="w-full rounded-xl border-slate-200 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Water Intake (L/day)</label>
                                        <input name="avg_water_consumption" type="number" step="0.01" placeholder="0.00" onChange={handleChange} required className="w-full rounded-xl border-slate-200 py-4 px-5 bg-slate-50/50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-2 bg-[#4f46e5] text-white py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#4338ca] hover:shadow-[0_10px_40px_rgba(79,70,229,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? 'Creating...' : <><CheckCircle2 size={20} /> Create farm & Link Owner</>}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default FarmForm;
