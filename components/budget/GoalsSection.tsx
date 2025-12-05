import React from 'react';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { GoalItem } from '../../types';

interface GoalsSectionProps {
  data: GoalItem[];
  currencySymbol: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
  onToggleCheck: (index: number, checked: boolean) => void;
  t: (key: string) => string;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({ data, currencySymbol, onUpdate, onDelete, onToggleCheck, t }) => {
  return (
    <div className="space-y-3">
        {data.map((item, idx) => {
            const progress = item.target > 0 ? (item.current / item.target) * 100 : 0;
            return (
                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.checked ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <Checkbox 
                            checked={item.checked} 
                            onChange={(val) => onToggleCheck(idx, val)} 
                        />
                        <input 
                            className={`bg-transparent font-bold text-lg outline-none flex-1 min-w-0 ${item.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}
                            value={item.name} 
                            onChange={(e) => onUpdate(idx, 'name', e.target.value)} 
                            placeholder={t('budget.placeholder.goal')}
                        />
                        <button onClick={() => onDelete(idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{t('budget.label.current_saved')}</span>
                            <div className="flex items-center text-blue-500 dark:text-blue-400">
                                <span className="text-sm mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full font-bold outline-none min-w-0" 
                                    value={item.current || ''} onChange={(e) => onUpdate(idx, 'current', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{t('budget.label.target')}</span>
                            <div className="flex items-center text-slate-700 dark:text-slate-300">
                                <span className="text-sm mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full font-bold outline-none min-w-0" 
                                    value={item.target || ''} onChange={(e) => onUpdate(idx, 'target', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">{t('budget.label.monthly_contribution')}</span>
                            <div className="flex items-center text-slate-900 dark:text-white w-20">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" 
                                    value={item.monthly || ''} onChange={(e) => onUpdate(idx, 'monthly', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                         <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                            <input type="text" className="bg-transparent w-full text-xs font-medium text-center outline-none text-slate-500" 
                                value={item.timeframe} placeholder={t('budget.placeholder.timeframe')} onChange={(e) => onUpdate(idx, 'timeframe', e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                            <span>{t('budget.label.progress')}</span>
                            <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );
};