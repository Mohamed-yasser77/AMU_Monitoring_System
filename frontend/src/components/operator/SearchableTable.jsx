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
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden animate-enter">
            <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-pulse" />
                        <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{filteredData.length} records found</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#4f46e5] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-[#4f46e5]/30 focus:ring-4 focus:ring-[#4f46e5]/5 w-full md:w-72 transition-all outline-none text-slate-600 placeholder:text-slate-300"
                        />
                    </div>
                    {actions}
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/30">
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredData.length > 0 ? (
                            filteredData.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`group transition-all duration-300 ${onRowClick ? 'cursor-pointer hover:bg-slate-50/50' : ''} animate-slide-up`}
                                    style={{ animationDelay: `${rowIdx * 30}ms` }}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="px-8 py-5">
                                            {col.render ? col.render(row) : (
                                                <span className="text-sm text-slate-600 font-bold group-hover:text-[#4f46e5] transition-colors">
                                                    {row[col.accessor] || '—'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-8 py-20 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300">
                                            <Filter size={28} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                No matches found
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                Try adjusting your search for "{searchTerm}"
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
