import React from 'react';
import { Trash2 } from 'lucide-react';
import { IncomeItem } from '../../types';

interface IncomeSectionProps {
  data: IncomeItem[];
  currencySymbol: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
  t: (key: string) => string;
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({ data, currencySymbol, onUpdate, onDelete, t }) => {
  return (
    <div className="space-y-3">
        {data.map((item, idx) => (
            <div key={item.id} id={item.id} className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
                <input 
                    className="bg-transparent font-bold text-lg text-slate-900 dark:text-white outline-none w-full mb-3" 
                    value={item.name} 
                    onChange={(e) => onUpdate(idx, 'name', e.target.value)} 
                    placeholder={t('budget.placeholder.source')}
                />
                <div className="flex gap-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">{t('budget.label.planned')}</span>
                        <div className="flex items-center">
                            <span className="text-slate-400 text-sm mr-1">{currencySymbol}</span>
                            <input type="number" className="bg-transparent w-full font-semibold outline-none text-slate-700 dark:text-slate-300 min-w-0" 
                                value={item.planned || ''} onChange={(e) => onUpdate(idx, 'planned', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg px-3 py-2 border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold block mb-1">{t('budget.label.actual')}</span>
                        <div className="flex items-center">
                            <span className="text-emerald-600/70 text-sm mr-1">{currencySymbol}</span>
                            <input type="number" className="bg-transparent w-full font-bold outline-none text-emerald-600 dark:text-emerald-400 min-w-0" 
                                value={item.actual || ''} onChange={(e) => onUpdate(idx, 'actual', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                    <button onClick={() => onDelete(idx)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all self-center"><Trash2 size={20} /></button>
                </div>
            </div>
        ))}
    </div>
  );
};