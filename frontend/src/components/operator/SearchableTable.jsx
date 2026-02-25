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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{filteredData.length} total entries found</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64 transition-all"
                        />
                    </div>
                    {actions}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.length > 0 ? (
                            filteredData.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : ''}`}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="px-6 py-4">
                                            {col.render ? col.render(row) : (
                                                <span className="text-sm text-slate-600 font-medium">
                                                    {row[col.accessor] || '—'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 italic">
                                    No records found matching your search.
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
