import React, { useState } from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';

const SearchableTable = ({
    title,
    data,
    columns,
    onRowClick,
    searchPlaceholder = "Search...",
    actions
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(row =>
        Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="bg-[#1c2025] rounded-xl border border-white/5 overflow-hidden animate-enter transition-all shadow-2xl">
            <div className="p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-3">{title}</h2>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-accent animate-pulse" />
                        <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{filteredData.length} records active</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative group/search">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-teal-accent transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-[#14171a] border border-white/10 rounded-lg text-xs font-medium focus:border-teal-accent/30 focus:ring-2 focus:ring-teal-accent/10 w-full md:w-80 transition-all outline-none text-slate-300 placeholder:text-slate-600"
                        />
                    </div>
                    {actions}
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar px-2 pb-2">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {filteredData.length > 0 ? (
                            filteredData.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`group transition-all duration-300 ${onRowClick ? 'cursor-pointer hover:bg-white/[0.025]' : ''} animate-slide-up`}
                                    style={{ animationDelay: `${rowIdx * 30}ms` }}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="px-8 py-6">
                                            {col.render ? col.render(row) : (
                                                <span className="text-sm text-slate-400 font-bold group-hover:text-teal-accent transition-colors">
                                                    {row[col.accessor] || '—'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-8 py-32 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="flex flex-col items-center gap-6 max-w-xs mx-auto">
                                        <div className="w-20 h-20 bg-surface-bg/50 rounded-xl border border-white/5 flex items-center justify-center text-slate-600">
                                            <Filter size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                                                No results found
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                Adjust your filters for "{searchTerm}"
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SearchableTable;
