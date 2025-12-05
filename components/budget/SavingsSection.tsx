import React from 'react';
import { Trash2, Target } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { SavingsItem } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface SavingsSectionProps {
  data: SavingsItem[];
  currencySymbol: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
  onTogglePaid: (index: number, paid: boolean) => void;
  t: (key: string) => string;
}

export const SavingsSection: React.FC<SavingsSectionProps> = ({ 
  data, 
  currencySymbol, 
  onUpdate, 
  onDelete, 
  onTogglePaid,
  t 
}) => {
  return (
    <div className="space-y-3">
        {data.map((item, idx) => {
             return (
                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.paid ? 'border-teal-500/30 opacity-80' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <Checkbox checked={!!item.paid} onChange={(val) => onTogglePaid(idx, val)} />
                        <input 
                            className={`flex-1 min-w-0 bg-transparent font-bold text-lg outline-none ${item.paid ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}
                            value={item.name} 
                            onChange={(e) => onUpdate(idx, 'name', e.target.value)} 
                            placeholder={t('budget.placeholder.fund')}
                        />
                        <button onClick={() => onDelete(idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pl-9">
                        <div className="bg-teal-50 dark:bg-teal-900/10 rounded-lg px-3 py-2 border border-teal-100 dark:border-teal-500/20">
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-bold block mb-1">{t('budget.label.total_fund')}</span>
                            <div className="flex items-center text-teal-700 dark:text-teal-300">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                    value={item.balance || 0} 
                                    // Manual update of balance logic could conflict with checkbox logic, but we allow editing total
                                    onChange={(e) => onUpdate(idx, 'balance', parseFloat(e.target.value) || 0)} 
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{t('budget.label.monthly_plan')}</span>
                            <div className="flex items-center text-slate-900 dark:text-white">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                    value={item.planned || ''} onChange={(e) => onUpdate(idx, 'planned', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                    </div>
                    {item.paid && (
                        <div className="pl-9 mt-2 text-[10px] font-bold text-teal-500 flex items-center gap-1">
                            <Target size={12} /> {formatCurrency(item.amount, currencySymbol)} {t('budget.label.saved_this_month')}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
  );
};