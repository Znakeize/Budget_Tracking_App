import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { BillItem } from '../../types';

interface BillsSectionProps {
  data: BillItem[];
  currencySymbol: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
  t: (key: string) => string;
}

export const BillsSection: React.FC<BillsSectionProps> = ({ data, currencySymbol, onUpdate, onDelete, t }) => {
  return (
    <div className="space-y-3">
        {data.map((item, idx) => {
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = !item.paid && item.dueDate < today;
            return (
                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.paid ? 'border-emerald-500/30 opacity-70' : 'border-slate-200 dark:border-slate-700'} ${isOverdue ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <Checkbox checked={item.paid} onChange={(val) => onUpdate(idx, 'paid', val)} />
                        <input 
                            className={`flex-1 min-w-0 bg-transparent font-bold text-lg outline-none ${item.paid ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}
                            value={item.name} 
                            onChange={(e) => onUpdate(idx, 'name', e.target.value)} 
                            placeholder={t('budget.placeholder.bill')}
                        />
                        <button onClick={() => onDelete(idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-9">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            <Calendar size={14} />
                            <input type="date" className="bg-transparent outline-none w-full text-xs font-bold uppercase" style={{ colorScheme: 'dark' }} value={item.dueDate} onChange={(e) => onUpdate(idx, 'dueDate', e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400">{t('budget.label.amt')}</span>
                            <div className="flex items-center flex-1 text-slate-900 dark:text-white">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" value={item.amount || ''} onChange={(e) => onUpdate(idx, 'amount', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                    </div>
                    {isOverdue && <div className="pl-9 mt-2 text-xs font-bold text-red-500 animate-pulse">⚠️ {t('budget.warn.overdue')}</div>}
                </div>
            );
        })}
    </div>
  );
};