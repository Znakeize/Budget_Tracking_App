
import React, { useState, useMemo } from 'react';
import { BudgetData, GoalItem } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { Card } from '../components/ui/Card';
import { Target, TrendingUp, Calendar, ArrowRight, DollarSign, Sliders, Sparkles, AlertCircle, RefreshCw, CheckCircle2, ChevronRight, Zap, FastForward, Trophy } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
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
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);
  // State to track which goals get priority allocation in the simulation
  const [priorityGoals, setPriorityGoals] = useState<Set<string>>(new Set());

  // --- Base Metrics ---
  const currentTotals = useMemo(() => calculateTotals(currentPeriod), [currentPeriod]);
  
  // FIX: Use all goals, not just unchecked ones, so the chart doesn't disappear
  const allGoals = currentPeriod.goals; 
  
  // --- Projected Metrics ---
  const projected = useMemo(() => {
      const baseIncome = currentTotals.totalIncome;
      const baseExpenses = currentTotals.totalExpenses + currentTotals.actualBills + currentTotals.actualDebts;
      
      const newIncome = baseIncome * (1 + incomeAdj / 100);
      const newExpenses = baseExpenses * (1 + expenseAdj / 100);
      
      // This is the simulated monthly surplus available for goals
      const netSavings = Math.max(0, newIncome - newExpenses);
      const currentSavings = Math.max(0, baseIncome - baseExpenses);
      
      return { newIncome, newExpenses, netSavings, currentSavings };
  }, [currentTotals, expenseAdj, incomeAdj]);

  // --- Advanced Allocation Logic ---
  const goalForecasts = useMemo(() => {
      const activeGoalsList = allGoals.filter(g => !g.checked);
      if (activeGoalsList.length === 0) return [];

      // 1. Determine Allocation Strategy
      const highPriorityIds = Array.from(priorityGoals);
      const highPriorityCount = highPriorityIds.filter(id => activeGoalsList.some(g => g.id === id)).length;
      
      // 2. Distribute Surplus
      let monthlyPerNormal = 0;
      let monthlyPerHigh = 0;

      if (projected.netSavings > 0) {
          if (highPriorityCount > 0) {
              // Strategy: Give 70% of surplus to High Priority, 30% to Normal
              // Or if only high priority exists, give 100%
              const highPool = highPriorityCount === activeGoalsList.length ? projected.netSavings : projected.netSavings * 0.7;
              const normalPool = projected.netSavings - highPool;

              monthlyPerHigh = highPool / highPriorityCount;
              monthlyPerNormal = (activeGoalsList.length - highPriorityCount) > 0 ? normalPool / (activeGoalsList.length - highPriorityCount) : 0;
          } else {
              // Equal distribution
              monthlyPerNormal = projected.netSavings / activeGoalsList.length;
          }
      }

      return allGoals.map(g => {
          if (g.checked) return { ...g, monthsToComplete: 0, completionDate: new Date(), isAccelerated: false, timeSaved: 0, simulatedMonthly: 0 };

          const isHigh = priorityGoals.has(g.id);
          const simulatedMonthly = isHigh ? monthlyPerHigh : monthlyPerNormal;
          
          // Base Case (Current Actual Budget)
          const currentMonthly = g.monthly || 1; // Avoid div by zero
          const remaining = Math.max(0, g.target - g.current);
          
          const currentMonths = Math.ceil(remaining / currentMonthly);
          const simulatedMonths = simulatedMonthly > 0 ? Math.ceil(remaining / simulatedMonthly) : 999;

          const today = new Date();
          const completionDate = new Date(today.getFullYear(), today.getMonth() + simulatedMonths, 1);
          const timeSaved = Math.max(0, currentMonths - simulatedMonths);

          return {
              ...g,
              monthsToComplete: simulatedMonths,
              completionDate,
              isAccelerated: timeSaved > 0,
              timeSaved,
              simulatedMonthly
          };
      });
  }, [allGoals, projected.netSavings, priorityGoals]);

  const togglePriority = (id: string) => {
      const newSet = new Set(priorityGoals);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setPriorityGoals(newSet);
  };

  // --- Goal Progress Rings Data ---
  const ringsData = useMemo(() => {
      // Take top 3 relevant goals (prioritizing active ones)
      const sortedForChart = [...allGoals].sort((a, b) => {
          if (a.checked === b.checked) return 0;
          return a.checked ? 1 : -1; // Active first
      }).slice(0, 3);

      const gradients = [
          ['#818cf8', '#4f46e5'], // Indigo
          ['#34d399', '#059669'], // Emerald
          ['#f472b6', '#db2777']  // Pink
      ];
      const goldGradient = ['#fcd34d', '#d97706']; // Gold for completed

      return {
          labels: sortedForChart.map(g => g.name),
          datasets: sortedForChart.map((g, i) => {
              const isCompleted = g.checked || g.current >= g.target;
              const progress = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
              const remaining = 100 - progress;
              
              return {
                  label: g.name,
                  data: [progress, remaining],
                  backgroundColor: (context: any) => {
                      const chart = context.chart;
                      const { ctx, chartArea } = chart;
                      if (!chartArea) return null;
                      
                      if (context.dataIndex === 0) {
                          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                          if (isCompleted) {
                              gradient.addColorStop(0, goldGradient[0]);
                              gradient.addColorStop(1, goldGradient[1]);
                          } else {
                              gradient.addColorStop(0, gradients[i % 3][0]);
                              gradient.addColorStop(1, gradients[i % 3][1]);
                          }
                          return gradient;
                      }
                      return 'rgba(255, 255, 255, 0.05)';
                  },
                  borderWidth: 0,
                  borderRadius: 20,
                  cutout: '75%',
                  circumference: 360,
                  weight: selectedGoalIndex === i ? 1.5 : 1
              };
          })
      };
  }, [allGoals, selectedGoalIndex]);

  const centerInfo = useMemo(() => {
      // Sort same as chart to match index
      const sortedForChart = [...allGoals].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1)).slice(0, 3);
      
      if (selectedGoalIndex !== null && sortedForChart[selectedGoalIndex]) {
          const g = sortedForChart[selectedGoalIndex];
          const isCompleted = g.checked || g.current >= g.target;
          const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;
          
          return {
              label: g.name,
              value: isCompleted ? 'DONE' : `${Math.round(progress)}%`,
              sub: isCompleted ? 'Goal Reached!' : `${formatCurrency(g.current, currencySymbol)} saved`,
              color: isCompleted ? 'text-amber-400' : (selectedGoalIndex === 0 ? 'text-indigo-400' : selectedGoalIndex === 1 ? 'text-emerald-400' : 'text-pink-400')
          };
      }
      
      const totalActive = allGoals.filter(g => !g.checked).length;
      const totalDone = allGoals.filter(g => g.checked).length;

      return {
          label: 'Total Goals',
          value: allGoals.length.toString(),
          sub: `${totalDone} Completed`,
          color: 'text-white'
      };
  }, [selectedGoalIndex, allGoals, currencySymbol]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pb-6">
        
        {/* Interactive Control Panel */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Sliders size={20} className="text-indigo-500" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Budget Simulator</h3>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Monthly Surplus</p>
                    <p className={`text-xl font-black ${projected.netSavings > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency(projected.netSavings, currencySymbol)}
                    </p>
                </div>
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

        {/* Goal Progress Rings Card */}
        <Card className="p-0 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
            <div className="p-6 pb-0 relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm shadow-inner">
                        <Target size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Goal Trajectory</h3>
                        <p className="text-xs text-slate-400">
                           {projected.netSavings > projected.currentSavings ? 
                             <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={10} /> Accelerating by {formatCurrency(projected.netSavings - projected.currentSavings, currencySymbol)}/mo</span> : 
                             "Standard Projection"
                           }
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 p-6 pt-4 relative z-10">
                {/* Rings Chart */}
                <div className="relative w-56 h-56 flex-shrink-0">
                    {allGoals.length > 0 ? (
                        <Doughnut 
                            data={ringsData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                animation: { animateScale: true, animateRotate: true },
                                cutout: '60%',
                            }}
                        />
                    ) : (
                         <div className="w-full h-full rounded-full border-4 border-slate-800 border-dashed flex items-center justify-center text-slate-600 text-xs">No Goals</div>
                    )}
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{centerInfo.label}</span>
                        <span className={`text-3xl font-black ${centerInfo.color} drop-shadow-md`}>{centerInfo.value}</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-1 bg-slate-800/50 px-2 py-0.5 rounded-full">{centerInfo.sub}</span>
                    </div>
                </div>

                {/* Interactive Legend List */}
                <div className="flex-1 w-full space-y-2">
                    {allGoals.slice(0, 3).map((goal, i) => {
                         const isCompleted = goal.checked || goal.current >= goal.target;
                         const isActive = selectedGoalIndex === i;
                         // Match colors to chart
                         const colorClass = isCompleted ? 'bg-amber-500' : (i%3 === 0 ? 'bg-indigo-500' : i%3 === 1 ? 'bg-emerald-500' : 'bg-pink-500');

                         return (
                             <div 
                                key={goal.id} 
                                onClick={() => setSelectedGoalIndex(isActive ? null : i)}
                                className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border border-transparent ${isActive ? 'bg-white/10 border-white/10 shadow-lg scale-[1.02]' : 'hover:bg-white/5'}`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className={`w-2 h-8 rounded-full ${colorClass} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                                     <div>
                                         <div className={`text-sm font-bold flex items-center gap-2 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                             {goal.name}
                                             {isCompleted && <Trophy size={12} className="text-amber-400" />}
                                         </div>
                                         <div className="text-[10px] text-slate-500">
                                             {isCompleted ? 'Completed' : `${formatCurrency(goal.current, currencySymbol)} / ${formatCurrency(goal.target, currencySymbol)}`}
                                         </div>
                                     </div>
                                 </div>
                                 {isActive && !isCompleted && (
                                    <div className="text-[9px] text-indigo-300 font-medium animate-in fade-in">
                                        Click below to boost priority
                                    </div>
                                 )}
                             </div>
                         );
                    })}
                    {allGoals.length === 0 && <p className="text-sm text-slate-500 italic text-center py-4">Create goals to track progress.</p>}
                </div>
            </div>
        </Card>

        {/* Goal Impact Timeline & Priority */}
        <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                <FastForward size={14} /> Smart Allocation
            </h3>
            <div className="space-y-3">
                {goalForecasts.map((goal) => {
                    const isCompleted = goal.checked || goal.current >= goal.target;
                    const isHighPriority = priorityGoals.has(goal.id);
                    
                    if (isCompleted) return null; // Don't show already completed goals in planner list

                    return (
                        <Card key={goal.id} className={`p-4 flex flex-col gap-3 transition-all ${isHighPriority ? 'border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                        {goal.name}
                                        {goal.isAccelerated && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><TrendingUp size={8} /> {goal.timeSaved} mo sooner</span>}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Target: {formatCurrency(goal.target, currencySymbol)}</p>
                                </div>
                                
                                {/* Priority Toggle */}
                                <button 
                                    onClick={() => togglePriority(goal.id)}
                                    className={`p-1.5 rounded-lg transition-all ${isHighPriority ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500'}`}
                                    title="Boost Priority"
                                >
                                    <Zap size={16} fill={isHighPriority ? "currentColor" : "none"} />
                                </button>
                            </div>
                            
                            {/* Visual Timeline Bar */}
                            <div className="relative pt-4 pb-2">
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-400 font-medium mt-1">
                                    <span>Now</span>
                                    <span>{goal.monthsToComplete < 999 ? `${goal.monthsToComplete} months left` : 'Paused'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Calendar size={12} className="text-indigo-500" />
                                    <span>Finish: <strong>{goal.completionDate.toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</strong></span>
                                </div>
                                <div className="font-mono font-bold text-slate-500">
                                    +{formatCurrency(goal.simulatedMonthly, currencySymbol)}/mo
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>

    </div>
  );
};
