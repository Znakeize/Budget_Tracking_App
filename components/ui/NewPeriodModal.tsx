import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { PeriodType } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface NewPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { period: PeriodType, month: number, year: number, startDate?: string, endDate?: string, rollover: number }) => void;
  defaultMonth: number;
  defaultYear: number;
  calculatedRollover: number;
  currencySymbol: string;
}

export const NewPeriodModal: React.FC<NewPeriodModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultMonth,
  defaultYear,
  calculatedRollover,
  currencySymbol
}) => {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
        setMonth(defaultMonth);
        setYear(defaultYear);
        setStartDate(''); 
        setEndDate('');
    }
  }, [isOpen, defaultMonth, defaultYear]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm({
        period,
        month,
        year,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        rollover: calculatedRollover
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <span>📅</span> Create New Budget Period
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Budget Period Type</label>
                <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodType)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: '2.5rem' }}
                >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="paycheck">By Paycheck</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Month</label>
                <select 
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: '2.5rem' }}
                >
                    {MONTH_NAMES.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Year</label>
                <input 
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors"
                    min="2020" max="2100"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Start Date</label>
                    <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">End Date</label>
                    <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <div className="text-xs font-semibold text-indigo-300 mb-1">
                    Rollover Information
                </div>
                <div className="text-sm text-slate-300">
                    The leftover balance from your current period <span className="text-white font-bold">({currencySymbol}{calculatedRollover.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span> will be automatically carried over to the new period.
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                    Create Period
                </button>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};