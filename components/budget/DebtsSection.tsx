import React from 'react';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { DebtItem } from '../../types';

interface DebtsSectionProps {
  data: DebtItem[];
  currencySymbol: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
  onTogglePaid: (index: number, paid: boolean) => void;
  t: (key: string) => string;
}

export const DebtsSection: React.FC<DebtsSectionProps> = ({ 
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
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = !item.paid && item.dueDate && item.dueDate < today;
            return (
                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.paid ? 'border-emerald-500/30 opacity-70' : 'border-slate-200 dark:border-slate-700'} ${isOverdue ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <Checkbox checked={item.paid} onChange={(val) => onTogglePaid(idx, val)} />
                        <input 
                            className={`flex-1 min-w-0 bg-transparent font-bold text-lg outline-none ${item.paid ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}
                            value={item.name} 
                            onChange={(e) => onUpdate(idx, 'name', e.target.value)} 
                            placeholder={t('budget.placeholder.debt')}
                        />
                        <button onClick={() => onDelete(idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pl-9">
                        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-500/20">
                            <span className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-bold block mb-1">{t('budget.label.monthly_pay')}</span>
                            <div className="flex items-center text-orange-700 dark:text-orange-300">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                    value={item.payment || ''} onChange={(e) => onUpdate(idx, 'payment', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className={`rounded-lg px-3 py-2 border flex flex-col justify-center ${isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}`}>
                            <span className="text-[10px] uppercase font-bold opacity-70 mb-1">{t('budget.section.bills')} {t('budget.warn.overdue')}?</span>
                            <input type="date" className="bg-transparent outline-none w-full text-xs font-bold uppercase p-0" style={{ colorScheme: 'dark' }} value={item.dueDate || ''} onChange={(e) => onUpdate(idx, 'dueDate', e.target.value)} />
                        </div>
                        <div className="col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">{t('budget.label.remaining_balance')}</span>
                            <div className="flex items-center text-slate-900 dark:text-white">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" 
                                    value={item.balance || ''} onChange={(e) => onUpdate(idx, 'balance', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );
};