import React, { useMemo } from 'react';
import { Trash2, TrendingUp, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { InvestmentItem } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InvestmentsSectionProps {
  data: InvestmentItem[];
  currencySymbol: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
  onToggleContributed: (index: number, contributed: boolean) => void;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onAddHistory: (index: number) => void;
  onUpdateHistory: (invIndex: number, histIndex: number, field: 'date' | 'amount', value: any) => void;
  onRemoveHistory: (invIndex: number, histIndex: number) => void;
  t: (key: string) => string;
}

export const InvestmentsSection: React.FC<InvestmentsSectionProps> = ({ 
  data, 
  currencySymbol, 
  onUpdate, 
  onDelete, 
  onToggleContributed,
  expandedId,
  setExpandedId,
  onAddHistory,
  onUpdateHistory,
  onRemoveHistory,
  t 
}) => {
  const totalValue = data.filter(i => i.type === 'personal' || !i.type).reduce((s, i) => s + i.amount, 0);

  return (
     <div className="space-y-4">
        <div className="bg-violet-100 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 text-center">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-300 uppercase tracking-wider block mb-1">{t('budget.summary.value')}</span>
            <span className="text-3xl font-extrabold text-violet-900 dark:text-white">
                {formatCurrency(totalValue, currencySymbol)}
            </span>
        </div>

        {data.map((item, idx) => {
            if (item.type === 'business') return null; // Don't show business assets in Budget Tracker
            const progress = item.target && item.target > 0 ? (item.amount / item.target) * 100 : 0;
            return (
                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.contributed ? 'border-violet-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <Checkbox 
                            checked={!!item.contributed} 
                            onChange={(val) => onToggleContributed(idx, val)} 
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <input 
                                    className={`bg-transparent font-bold text-lg outline-none flex-1 min-w-0 ${item.contributed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`} 
                                    value={item.name} 
                                    onChange={(e) => onUpdate(idx, 'name', e.target.value)} 
                                    placeholder={t('budget.placeholder.asset')}
                                />
                                <button 
                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${expandedId === item.id ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                                >
                                    {expandedId === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => onDelete(idx)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3 pl-9">
                        <div className="bg-violet-50 dark:bg-violet-900/10 rounded-lg px-3 py-2 border border-violet-100 dark:border-violet-500/20">
                            <span className="text-[10px] text-violet-600 dark:text-violet-400 uppercase font-bold block mb-1">{t('budget.label.current_value')}</span>
                            <div className="flex items-center text-violet-700 dark:text-violet-300">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                    value={item.amount || 0} onChange={(e) => onUpdate(idx, 'amount', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{t('budget.label.target_value')}</span>
                            <div className="flex items-center text-slate-900 dark:text-white">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                    value={item.target || ''} onChange={(e) => onUpdate(idx, 'target', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                    </div>

                    <div className="pl-9 mb-3">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">{t('budget.label.monthly_contribution')}</span>
                            <div className="flex items-center text-slate-900 dark:text-white w-24">
                                <span className="text-xs mr-1">{currencySymbol}</span>
                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" 
                                    value={item.monthly || ''} onChange={(e) => onUpdate(idx, 'monthly', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        {item.contributed && (
                            <div className="mt-1 text-[10px] font-bold text-violet-500 flex items-center gap-1 justify-end">
                                <TrendingUp size={10} /> {t('budget.label.contributed_month')}
                            </div>
                        )}
                    </div>

                    <div className="pl-9">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                            <span>{t('budget.label.progress')}</span>
                            <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        
                        {/* Mini Sparkline always visible */}
                        <InvestmentSparkline amount={item.amount} history={item.history} />
                    </div>

                    {expandedId === item.id && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 pl-9">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase">{t('budget.label.history')}</h4>
                                <button onClick={() => onAddHistory(idx)} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md hover:bg-slate-50 shadow-sm flex items-center gap-1">
                                    <Plus size={10} /> {t('budget.label.add_entry')}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {(!item.history || item.history.length === 0) && (
                                    <p className="text-xs text-slate-400 italic text-center py-2">No history records found.</p>
                                )}
                                {item.history?.map((hist, hIdx) => (
                                    <div key={hIdx} className="flex gap-2 items-center">
                                        <input 
                                            type="date" 
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 outline-none w-28"
                                            value={hist.date}
                                            onChange={(e) => onUpdateHistory(idx, hIdx, 'date', e.target.value)}
                                        />
                                        <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5">
                                            <span className="text-xs text-slate-400 mr-1">$</span>
                                            <input 
                                                type="number" 
                                                className="bg-transparent w-full text-xs font-bold outline-none text-slate-700 dark:text-slate-200"
                                                value={hist.amount}
                                                onChange={(e) => onUpdateHistory(idx, hIdx, 'amount', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <button onClick={() => onRemoveHistory(idx, hIdx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
     </div>
  );
};

const InvestmentSparkline = ({ amount, history }: { amount: number, history?: { date: string, amount: number }[] }) => {
    const chartData = useMemo(() => {
        let points = [];
        let labels = [];

        if (history && history.length > 0) {
            points = history.map(h => h.amount);
            labels = history.map(h => h.date);
            // Ensure the very current amount is represented as the last point if it differs from history
            if (history[history.length - 1].amount !== amount) {
                points.push(amount);
                labels.push('Now');
            }
        } else {
             const steps = 6;
             let current = amount * 0.8;
             if (amount <= 0) {
                 points = Array(steps + 1).fill(0);
             } else {
                for (let i = 0; i < steps; i++) {
                    const noise = (Math.random() - 0.5) * (amount * 0.1); 
                    const trend = (amount - current) / (steps - i);
                    current += trend + noise;
                    points.push(current);
                }
                points.push(amount);
             }
             labels = Array(steps + 1).fill('');
        }

        return {
            labels: labels,
            datasets: [{
                data: points,
                borderColor: '#a78bfa',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: history && history.length > 0 ? 2 : 0,
                fill: false,
            }]
        };
    }, [amount, history]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: { display: false },
            y: { display: false, min: Math.min(...chartData.datasets[0].data) * 0.95, max: Math.max(...chartData.datasets[0].data) * 1.05 }
        },
        animation: { duration: 0 } as any
    };

    return (
        <div className="w-full h-10 opacity-70">
            <Line data={chartData} options={options} />
        </div>
    );
};