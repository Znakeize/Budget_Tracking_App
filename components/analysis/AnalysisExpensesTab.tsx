
import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency, calculateTotals } from '../../utils/calculations';
import { Line, Bar } from 'react-chartjs-2';
import { Activity, TrendingDown, Sparkles, ShoppingBag, Home, Car, Coffee, Gift, Zap, FileText, ChevronRight } from 'lucide-react';
import { BudgetData, ShoppingListData } from '../../types';
import { MONTH_NAMES } from '../../constants';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, any> = {
    'Housing': Home,
    'Rent': Home,
    'Mortgage': Home,
    'Transport': Car,
    'Fuel': Car,
    'Food': Coffee,
    'Dining': Coffee,
    'Groceries': ShoppingBag,
    'Entertainment': Gift,
    'Shopping': ShoppingBag,
    'Utilities': Zap,
    'Bills': FileText,
};

interface AnalysisExpensesTabProps {
    sortedHistory: BudgetData[];
    currentPeriod: BudgetData;
    currentTotals: any;
    currencySymbol: string;
    shoppingLists: ShoppingListData[];
    onCategoryClick: (category: string) => void;
}

export const AnalysisExpensesTab: React.FC<AnalysisExpensesTabProps> = ({ 
    sortedHistory, 
    currentPeriod, 
    currentTotals, 
    currencySymbol, 
    shoppingLists,
    onCategoryClick 
}) => {
    const labels = sortedHistory.map(h => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0, 3) : 'Pd');

    const expenseTrendData = {
        labels,
        datasets: [{
            label: 'Monthly Expenses',
            data: sortedHistory.map(h => calculateTotals(h).totalExpenses),
            borderColor: '#a855f7', // Purple
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
                gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 3
        }]
    };

    const topCategory = [...currentPeriod.expenses].sort((a,b) => b.spent - a.spent)[0];

    // Calculate Top Categories List
    const expensesList = [...currentPeriod.expenses].sort((a, b) => b.spent - a.spent);

    const breakdownChartData = {
      labels: expensesList.map(e => e.name),
      datasets: [{
          label: 'Spent',
          data: expensesList.map(e => e.spent),
          backgroundColor: [
              '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
              '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
          ],
          borderRadius: 4,
          barThickness: 20
      }]
    };

    // Calculate Top Merchants from Shopping Lists
    const merchantSpending: Record<string, number> = {};
    shoppingLists.forEach(list => {
        list.shops.forEach(shop => {
            const shopTotal = shop.items.filter(i => i.checked).reduce((sum, i) => sum + (i.actualPrice || i.price || 0), 0);
            if (shopTotal > 0) {
                merchantSpending[shop.name] = (merchantSpending[shop.name] || 0) + shopTotal;
            }
        });
    });
    const topMerchants = Object.entries(merchantSpending)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        interaction: { mode: 'index' as const, intersect: false },
    };

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        
        <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 flex flex-col justify-center bg-white dark:bg-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Spent (Mo)</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(currentTotals.totalExpenses, currencySymbol)}
                </div>
            </Card>
            <Card className="p-3 flex flex-col justify-center bg-white dark:bg-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Daily Average</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(currentTotals.totalExpenses / 30, currencySymbol)}
                </div>
            </Card>
        </div>

        <Card className="p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                <Activity size={16} className="text-purple-500" /> Monthly Expense Trend
            </h3>
            <div className="h-48 relative">
                <Line data={expenseTrendData} options={chartOptions} />
            </div>
        </Card>

        {/* AI Suggestions */}
        <Card className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-500/20">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">AI Spending Insights</h3>
            </div>
            <div className="space-y-3">
                {topCategory ? (
                    <div className="flex gap-3 items-start p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <div className="mt-0.5"><TrendingDown size={14} className="text-emerald-500" /></div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            "Reduce <span className="font-bold">{topCategory.name}</span> cost by 8% to reach your monthly savings goal."
                        </p>
                    </div>
                ) : null}
            </div>
        </Card>

        {/* Detailed Breakdown Chart */}
        <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Detailed Breakdown</h3>
              <div className="h-64 relative"> 
                  <Bar 
                      data={breakdownChartData} 
                      options={{
                          indexAxis: 'y' as const,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                              x: { display: false, grid: { display: false } },
                              y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11, weight: 'bold' } } }
                          }
                      }} 
                  />
              </div>
         </Card>

        {/* Top Categories List - NEW DESIGN */}
        <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Top Categories</h3>
            <div className="space-y-3">
                {expensesList.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.name] || ShoppingBag;
                    const budget = cat.budgeted || 0;
                    const percent = budget > 0 ? (cat.spent / budget) * 100 : 0;
                    const isOver = percent > 100;
                    
                    return (
                        <div 
                            key={cat.id}
                            onClick={() => onCategoryClick(cat.name)}
                            className="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{cat.name}</h4>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                        {formatCurrency(cat.spent, currencySymbol)} <span className="opacity-50">/ {formatCurrency(budget, currencySymbol)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                    {Math.round(percent)}%
                                </span>
                                <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
                            </div>
                        </div>
                    );
                })}
                {expensesList.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                        No expense categories found.
                    </div>
                )}
            </div>
        </div>

        {/* Top Merchants (Global Backup) */}
        <Card className="p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                <ShoppingBag size={16} className="text-pink-500" /> Top Merchants (All)
            </h3>
            <div className="space-y-3">
                {topMerchants.length > 0 ? topMerchants.map((merchant, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-pink-100 text-pink-600': 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                #{i+1}
                            </div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{merchant.name}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(merchant.amount, currencySymbol)}</div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                        No shopping data available.
                    </div>
                )}
            </div>
        </Card>
    </div>
    );
};
