import React, { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, ShieldAlert, Zap, Loader2, ArrowRight } from 'lucide-react';
import aiService from '../../services/aiService';

const HarvestForecastWidget = ({ molecule, species, treatmentDate, onApplyDate }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchForecast = async () => {
        if (!molecule || !species || !treatmentDate) return;

        setLoading(true);
        setError(null);
        try {
            const res = await aiService.predictSafeHarvest(molecule, species, treatmentDate);
            setData(res);
        } catch (err) {
            setError('Could not calculate safe date');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, [molecule, species, treatmentDate]);

    if (!molecule || !species || !treatmentDate) {
        return (
            <div className="p-8 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-40">
                <Zap size={32} className="text-slate-700 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select Inputs for AI Forecast</p>
            </div>
        );
    }

    return (
        <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${loading ? 'bg-white/5 border-white/5 animate-pulse' :
                error ? 'bg-rose-500/5 border-rose-500/10' :
                    data?.flagged_for_review ? 'bg-amber-500/5 border-amber-500/10' :
                        'bg-[#00c096]/5 border-[#00c096]/10'
            }`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${loading ? 'bg-white/5 text-slate-700 border-white/5' :
                            error ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                'bg-[#00c096]/10 text-[#00c096] border-[#00c096]/20'
                        }`}>
                        <Zap size={18} />
                    </div>
                    <div>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${loading ? 'text-slate-600' : 'text-slate-300'
                            }`}>Predictive Insight</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">AI Harvest Forecaster</p>
                    </div>
                </div>
                {loading && <Loader2 size={16} className="animate-spin text-[#00c096]" />}
            </div>

            {error ? (
                <div className="space-y-4">
                    <p className="text-xs font-bold text-rose-400 capitalize">{error}</p>
                    <button onClick={fetchForecast} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Try Again</button>
                </div>
            ) : data ? (
                <div className="space-y-6">
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-white tracking-tighter">
                            {data.withdrawal_days !== null ? data.withdrawal_days : '??'}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Days Withdrawal</span>
                    </div>

                    <div className="bg-[#01050a] rounded-2xl p-5 border border-white/5 flex items-center justify-between group/box">
                        <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Safe Harvest Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-[#00c096]" />
                                <span className="text-sm font-black text-white uppercase tracking-tighter">
                                    {data.safe_harvest_date ? new Date(data.safe_harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}
                                </span>
                            </div>
                        </div>
                        {onApplyDate && data.safe_harvest_date && (
                            <button
                                onClick={() => onApplyDate(data.safe_harvest_date)}
                                className="w-10 h-10 bg-[#00c096]/10 text-[#00c096] border border-[#00c096]/20 rounded-xl flex items-center justify-center hover:bg-[#00c096] hover:text-[#14171a] transition-all group-hover/box:scale-105"
                            >
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-start gap-3 mt-4">
                        {data.flagged_for_review ? (
                            <>
                                <ShieldAlert size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-[9px] font-bold text-amber-500 leading-normal uppercase">
                                    Data derived from PK literature. High uncertainty. Consult Vet.
                                </p>
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={14} className="text-[#00c096] mt-0.5 shrink-0" />
                                <p className="text-[9px] font-bold text-[#00c096]/60 leading-normal uppercase">
                                    Verified by molecule withdrawal registry. 100% Reliability.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 size={24} className="animate-spin text-[#00c096] opacity-20" />
                </div>
            )}
        </div>
    );
};

export default HarvestForecastWidget;
