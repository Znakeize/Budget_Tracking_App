
import React from 'react';
import { Filter, X } from 'lucide-react';
import { MONTH_NAMES } from '../../constants';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: any;
    onUpdate: (config: any) => void;
    allCategories: string[];
    currencySymbol: string;
    years: number[];
}

export const FilterModal: React.FC<FilterModalProps> = ({ 
    isOpen, 
    onClose, 
    config, 
    onUpdate, 
    allCategories, 
    currencySymbol, 
    years 
}) => {
    if (!isOpen) return null;

    const handleReset = () => {
        onUpdate({
            timeMode: 'preset',
            timeframe: 'ALL',
            specificMonth: { month: new Date().getMonth(), year: new Date().getFullYear() },
            dateRange: { start: '', end: '' },
            categories: [],
            minAmount: '',
            maxAmount: ''
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Filter size={18} /> Advanced Filters
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="space-y-6">
                    {/* Time Mode Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['preset', 'month', 'range'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onUpdate({...config, timeMode: mode})}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${config.timeMode === mode ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                                {mode === 'preset' ? 'Quick' : mode}
                            </button>
                        ))}
                    </div>

                    {/* Time Filter Content */}
                    {config.timeMode === 'preset' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Quick Period</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['3M', '6M', '1Y', 'ALL'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => onUpdate({...config, timeframe: tf})}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all ${config.timeframe === tf ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {config.timeMode === 'month' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Year</label>
                                <select 
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-sm font-bold outline-none"
                                    value={config.specificMonth.year}
                                    onChange={(e) => onUpdate({...config, specificMonth: { ...config.specificMonth, year: parseInt(e.target.value) }})}
                                >
                                    {(years && years.length > 0 ? years : [new Date().getFullYear()]).map((y: number) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Month</label>
                                <select 
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-sm font-bold outline-none"
                                    value={config.specificMonth.month}
                                    onChange={(e) => onUpdate({...config, specificMonth: { ...config.specificMonth, month: parseInt(e.target.value) }})}
                                >
                                    {MONTH_NAMES.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {config.timeMode === 'range' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Start Date</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-xs font-bold outline-none"
                                    value={config.dateRange.start}
                                    onChange={(e) => onUpdate({...config, dateRange: { ...config.dateRange, start: e.target.value }})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">End Date</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-xs font-bold outline-none"
                                    value={config.dateRange.end}
                                    onChange={(e) => onUpdate({...config, dateRange: { ...config.dateRange, end: e.target.value }})}
                                />
                            </div>
                        </div>
                    )}

                    {/* Amount Range */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Amount Range</label>
                        <div className="flex gap-3 items-center">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2 pl-7 pr-3 text-sm font-bold outline-none"
                                    placeholder="Min"
                                    value={config.minAmount}
                                    onChange={e => onUpdate({...config, minAmount: e.target.value})}
                                />
                            </div>
                            <span className="text-slate-400 font-bold">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2 pl-7 pr-3 text-sm font-bold outline-none"
                                    placeholder="Max"
                                    value={config.maxAmount}
                                    onChange={e => onUpdate({...config, maxAmount: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Categories</label>
                            {config.categories.length > 0 && (
                                <button onClick={() => onUpdate({...config, categories: []})} className="text-[10px] text-indigo-500 font-bold">Clear All</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                            {allCategories.map((cat: string) => {
                                const isSelected = config.categories.includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            const newCats = isSelected 
                                                ? config.categories.filter((c: string) => c !== cat)
                                                : [...config.categories, cat];
                                            onUpdate({...config, categories: newCats});
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                            isSelected 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={handleReset} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Reset
                        </button>
                        <button onClick={onClose} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors shadow-lg active:scale-95">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
