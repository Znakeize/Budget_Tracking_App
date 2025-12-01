
import React, { useState, useMemo } from 'react';
import { BudgetData, GoalItem } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { Card } from '../components/ui/Card';
import { Target, TrendingUp, Calendar, ArrowRight, DollarSign, Sliders, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

interface AnalysisPlannerProps {
  history: BudgetData[];
  currentPeriod: BudgetData;
  currencySymbol: string;
}

export const AnalysisPlanner: React.FC<AnalysisPlannerProps> = ({ history, currentPeriod, currencySymbol }) => {
  const [expenseAdj, setExpenseAdj] = useState(0); // Percentage adjustment
  const [incomeAdj, setIncomeAdj] = useState(0);   // Percentage adjustment

  // --- Base Metrics ---
  const currentTotals = useMemo(() => calculateTotals(currentPeriod), [currentPeriod]);
  const activeGoals = currentPeriod.goals.filter(g => !g.checked);

  // --- Projected Metrics ---
  const projected = useMemo(() => {
      const baseIncome = currentTotals.totalIncome;
      const baseExpenses = currentTotals.totalExpenses + currentTotals.actualBills + currentTotals.actualDebts;
      
      const newIncome = baseIncome * (1 + incomeAdj / 100);
      const newExpenses = baseExpenses * (1 + expenseAdj / 100);
      
      const netSavings = newIncome - newExpenses;
      const currentSavings = baseIncome - baseExpenses;
      
      return { newIncome, newExpenses, netSavings, currentSavings };
  }, [currentTotals, expenseAdj, incomeAdj]);

  // --- Goal Forecasting ---
  const goalForecasts = useMemo(() => {
      if (projected.netSavings <= 0) return [];

      // Distribute net savings across goals equally for simplified projection
      const monthlyPerGoal = activeGoals.length > 0 ? projected.netSavings / activeGoals.length : 0;
      
      return activeGoals.map(g => {
          const remaining = g.target - g.current;
          const monthsToComplete = monthlyPerGoal > 0 ? Math.ceil(remaining / monthlyPerGoal) : 999;
          
          const today = new Date();
          const completionDate = new Date(today.getFullYear(), today.getMonth() + monthsToComplete, 1);
          
          return {
              ...g,
              monthsToComplete,
              completionDate
          };
      });
  }, [activeGoals, projected.netSavings]);

  // --- Goal Progress Rings Data ---
  const ringsData = useMemo(() => {
      // Take top 3 active goals for the rings to keep it readable
      const topGoals = activeGoals.slice(0, 3);
      const colors = ['#6366f1', '#10b981', '#f59e0b']; // Indigo, Emerald, Amber

      return {
          labels: topGoals.map(g => g.name),
          datasets: topGoals.map((g, i) => {
              const progress = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
              const remaining = 100 - progress;
              
              return {
                  label: g.name,
                  data: [progress, remaining],
                  backgroundColor: [colors[i], 'rgba(255, 255, 255, 0.1)'], // Color vs Track
                  borderWidth: 0,
                  borderRadius: 20,
                  cutout: `${40 + (i * 12)}%`, // Creates the concentric effect by varying cutout if we weren't relying on stacking. 
                  // ChartJS Stacking: Dataset 0 is outermost.
                  // To make them concentric rings, we simply provide multiple datasets.
                  weight: 1
              };
          }).reverse() // Reverse so first goal is outer ring
      };
  }, [activeGoals]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pb-6">
        
        {/* Goal Progress Rings Card */}
        <Card className="p-6 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
                    <Target size={20} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold">Goal Progress Rings</h3>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                {/* Rings Chart */}
                <div className="relative w-48 h-48 flex-shrink-0">
                    {activeGoals.length > 0 ? (
                        <Doughnut 
                            data={ringsData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { 
                                    legend: { display: false },
                                    tooltip: { enabled: false } 
                                },
                                animation: { animateScale: true, animateRotate: true },
                                cutout: '40%'
                            }}
                        />
                    ) : (
                         <div className="w-full h-full rounded-full border-4 border-slate-800 border-dashed flex items-center justify-center text-slate-600 text-xs">No Goals</div>
                    )}
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-white">{activeGoals.length}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                    </div>
                </div>

                {/* Legend / List */}
                <div className="flex-1 w-full space-y-4">
                    {activeGoals.slice(0, 3).map((goal, i) => {
                         const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                         const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'];
                         const textColors = ['text-indigo-400', 'text-emerald-400', 'text-amber-400'];

                         return (
                             <div key={goal.id} className="flex justify-between items-center group cursor-default">
                                 <div className="flex items-center gap-3">
                                     <div className={`w-3 h-3 rounded-full ${colors[i]} shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform`}></div>
                                     <div>
                                         <div className="text-sm font-bold text-slate-200">{goal.name}</div>
                                         <div className="text-[10px] text-slate-500">
                                             {formatCurrency(goal.current, currencySymbol)} / {formatCurrency(goal.target, currencySymbol)}
                                         </div>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className={`text-sm font-bold ${textColors[i]}`}>{Math.round(progress)}%</div>
                                 </div>
                             </div>
                         );
                    })}
                    {activeGoals.length === 0 && <p className="text-sm text-slate-500 italic">Set goals in the Budget tab to see them here.</p>}
                </div>
            </div>
        </Card>

        {/* Interactive Control Panel */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-2 mb-6">
                <Sliders size={20} className="text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Budget Simulator</h3>
            </div>

            <div className="space-y-6">
                {/* Expense Slider */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Adjust Expenses</label>
                        <span className={`text-sm font-bold ${expenseAdj > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {expenseAdj > 0 ? '+' : ''}{expenseAdj}%
                        </span>
                    </div>
                    <input 
                        type="range" min="-50" max="50" step="5" 
                        value={expenseAdj} 
                        onChange={(e) => setExpenseAdj(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Frugal (-50%)</span>
                        <span>Lavish (+50%)</span>
                    </div>
                </div>

                {/* Income Slider */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Adjust Income</label>
                        <span className={`text-sm font-bold ${incomeAdj >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {incomeAdj > 0 ? '+' : ''}{incomeAdj}%
                        </span>
                    </div>
                    <input 
                        type="range" min="-50" max="50" step="5" 
                        value={incomeAdj} 
                        onChange={(e) => setIncomeAdj(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
            </div>
        </Card>

        {/* Results Overview */}
        <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-slate-100 dark:bg-slate-800/50 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Projected Savings</span>
                <div className={`text-xl font-bold mt-1 ${projected.netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {formatCurrency(projected.netSavings, currencySymbol)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                    vs {formatCurrency(projected.currentSavings, currencySymbol)} (Base)
                </div>
            </Card>
            <Card className="p-4 bg-slate-100 dark:bg-slate-800/50 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Impact</span>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {projected.netSavings - projected.currentSavings > 0 ? '+' : ''}
                    {formatCurrency(projected.netSavings - projected.currentSavings, currencySymbol)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                    Monthly Difference
                </div>
            </Card>
        </div>

        {/* AI Insight Card */}
        <Card className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none shadow-lg">
            <div className="flex gap-3">
                <Sparkles className="text-yellow-300 shrink-0 mt-1" size={20} />
                <div>
                    <h4 className="text-sm font-bold mb-1">AI Recommendation</h4>
                    <p className="text-xs text-violet-100 leading-relaxed">
                        {projected.netSavings > projected.currentSavings 
                            ? "Great moves! Reducing expenses by just 10% can accelerate your 'New Home' goal by 4 months."
                            : "Increasing income has a higher impact on your long-term wealth than cutting small expenses. Consider a side hustle."}
                    </p>
                </div>
            </div>
        </Card>

        {/* Goal Impact Timeline */}
        <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                <Target size={14} /> Goal Acceleration
            </h3>
            <div className="space-y-3">
                {activeGoals.map((goal, idx) => {
                    const forecast = goalForecasts.find(g => g.id === goal.id);
                    const isFaster = projected.netSavings > projected.currentSavings;
                    
                    return (
                        <Card key={goal.id} className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{goal.name}</h4>
                                    <p className="text-xs text-slate-500">Target: {formatCurrency(goal.target, currencySymbol)}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isFaster ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {forecast ? forecast.completionDate.toLocaleDateString(undefined, {month: 'short', year: 'numeric'}) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Visual Timeline Bar */}
                            <div className="relative pt-4 pb-2">
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}></div>
                                </div>
                                {/* Markers */}
                                <div className="absolute top-0 left-0 w-full flex justify-between text-[9px] text-slate-400 font-medium">
                                    <span>Now</span>
                                    <span>Goal</span>
                                </div>
                            </div>

                            {forecast && forecast.monthsToComplete < 60 && (
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                    <Calendar size={12} className="text-indigo-500" />
                                    <span>
                                        {projected.netSavings > 0 
                                            ? `On track to finish in ${forecast.monthsToComplete} months` 
                                            : "Budget deficit - Goal paused"}
                                    </span>
                                </div>
                            )}
                        </Card>
                    );
                })}
                {activeGoals.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        No active goals to forecast.
                    </div>
                )}
            </div>
        </div>

    </div>
  );
};
