
import React, { useMemo } from 'react';
import { BudgetData } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { Card } from '../components/ui/Card';
import { 
  TrendingUp, TrendingDown, Wallet, Activity, 
  Target, Shield, ArrowUpRight, ArrowDownRight, 
  Layers, CreditCard, DollarSign, PieChart, Lock,
  Zap, CheckCircle, AlertTriangle, Briefcase
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler, BarElement } from 'chart.js';
import { MONTH_NAMES } from '../constants';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler, BarElement);

interface AnalysisOverviewProps {
  history: BudgetData[];
  currentPeriod: BudgetData;
  currencySymbol: string;
}

export const AnalysisOverview: React.FC<AnalysisOverviewProps> = ({ history, currentPeriod, currencySymbol }) => {
  
  // --- Data Processing ---
  const sortedHistory = useMemo(() => {
      const all = [...history];
      if (!all.find(h => h.id === currentPeriod.id)) {
          all.push(currentPeriod);
      }
      return all.sort((a, b) => a.created - b.created);
  }, [history, currentPeriod]);

  const currentTotals = useMemo(() => calculateTotals(currentPeriod), [currentPeriod]);
  
  // Derived Metrics
  const metrics = useMemo(() => {
      // 1. Net Worth Components
      const cashSavings = currentPeriod.savings.reduce((sum, s) => sum + (s.balance || 0), 0);
      const investments = currentPeriod.investments.reduce((sum, i) => sum + i.amount, 0);
      const totalAssets = cashSavings + investments;
      const totalDebts = currentPeriod.debts.reduce((sum, d) => sum + d.balance, 0);
      const netWorth = totalAssets - totalDebts;

      // 2. Ratios
      const monthlyIncome = currentTotals.totalIncome;
      const monthlyExpenses = currentTotals.totalExpenses + currentTotals.actualBills;
      
      const savingsRate = monthlyIncome > 0 
          ? ((currentTotals.totalSavings + currentTotals.actualInvestments) / monthlyIncome) * 100 
          : 0;
          
      const debtServiceRatio = monthlyIncome > 0 
          ? (currentTotals.actualDebts / monthlyIncome) * 100 
          : 0;

      const liquidityRatio = monthlyExpenses > 0 
          ? totalAssets / monthlyExpenses 
          : 0; // Months of runway

      return {
          cashSavings,
          investments,
          totalAssets,
          totalDebts,
          netWorth,
          savingsRate,
          debtServiceRatio,
          liquidityRatio,
          monthlyIncome
      };
  }, [currentPeriod, currentTotals]);

  // --- Financial Health Score Calculation (0-100) ---
  const healthScore = useMemo(() => {
      let score = 0;
      
      // 1. Savings Rate (Max 40)
      if (metrics.savingsRate >= 20) score += 40;
      else if (metrics.savingsRate >= 10) score += 20;
      else if (metrics.savingsRate > 0) score += 10;

      // 2. Debt Service Ratio (Max 30) - Lower is better
      if (metrics.debtServiceRatio === 0) score += 30;
      else if (metrics.debtServiceRatio < 15) score += 20;
      else if (metrics.debtServiceRatio < 30) score += 10;

      // 3. Liquidity / Runway (Max 30)
      if (metrics.liquidityRatio >= 6) score += 30;
      else if (metrics.liquidityRatio >= 3) score += 20;
      else if (metrics.liquidityRatio >= 1) score += 10;

      return score;
  }, [metrics]);

  const getHealthLabel = (score: number) => {
      if (score >= 80) return { label: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-500', sub: 'Your finances are rock solid!' };
      if (score >= 60) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500', sub: 'You are on the right track.' };
      if (score >= 40) return { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500', sub: 'Room for improvement.' };
      return { label: 'Needs Attention', color: 'text-red-500', bg: 'bg-red-500', sub: 'Focus on reducing debt & saving.' };
  };

  const health = getHealthLabel(healthScore);

  // --- Chart Configurations ---

  // 1. Net Worth Evolution (Area Chart)
  const netWorthData = {
      labels: sortedHistory.map(h => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0, 3) : 'Pd'),
      datasets: [{
          label: 'Net Worth',
          data: sortedHistory.map(h => {
              const t = calculateTotals(h);
              // Estimate past net worth roughly if historical snapshots aren't perfect
              // Ideally we'd have full balance sheets in history. 
              // Using approximation: (Savings Accumulation + Investments) - Debts
              const savings = h.savings.reduce((s, i) => s + (i.balance || 0), 0);
              const inv = h.investments.reduce((s, i) => s + i.amount, 0);
              const debt = h.debts.reduce((s, i) => s + i.balance, 0);
              return (savings + inv) - debt;
          }),
          fill: true,
          backgroundColor: (ctx: any) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)'); // Violet
              gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
              return gradient;
          },
          borderColor: '#8b5cf6',
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#fff'
      }]
  };

  // 2. Wealth Composition (Doughnut)
  // Categories: Cash, Investments (Split by type if possible), Debts (as negative context or separate)
  // Let's show Asset Allocation
  const assetData = {
      labels: ['Cash Savings', 'Stocks/Funds', 'Real Estate', 'Crypto', 'Business'],
      datasets: [{
          data: [
              metrics.cashSavings,
              currentPeriod.investments.filter(i => i.category === 'Stocks' || i.category === 'MutualFunds').reduce((s, i) => s + i.amount, 0),
              currentPeriod.investments.filter(i => i.category === 'RealEstate').reduce((s, i) => s + i.amount, 0),
              currentPeriod.investments.filter(i => i.category === 'Crypto').reduce((s, i) => s + i.amount, 0),
              currentPeriod.investments.filter(i => i.type === 'business').reduce((s, i) => s + i.amount, 0),
          ],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#6366f1'],
          borderWidth: 0,
          hoverOffset: 4
      }]
  };

  // 3. Flow Comparison (Bar)
  const flowData = {
      labels: sortedHistory.slice(-6).map(h => MONTH_NAMES[h.month].substring(0,3)),
      datasets: [
          {
              label: 'Income',
              data: sortedHistory.slice(-6).map(h => calculateTotals(h).totalIncome),
              backgroundColor: '#10b981',
              borderRadius: 4
          },
          {
              label: 'Expenses',
              data: sortedHistory.slice(-6).map(h => calculateTotals(h).totalExpenses + calculateTotals(h).actualBills),
              backgroundColor: '#ef4444',
              borderRadius: 4
          }
      ]
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pb-6">
        
        {/* 1. Financial Health Score Card */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl p-6">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2 opacity-80">
                        <Activity size={18} className="text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-widest">Financial Health</span>
                    </div>
                    <div className="flex items-baseline justify-center md:justify-start gap-1">
                        <span className={`text-6xl font-black ${health.color}`}>{healthScore}</span>
                        <span className="text-xl font-medium text-slate-500">/100</span>
                    </div>
                    <div className="mt-2">
                        <h3 className="text-xl font-bold">{health.label}</h3>
                        <p className="text-xs text-slate-400">{health.sub}</p>
                    </div>
                </div>

                {/* Score Breakdown Mini-Grid */}
                <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                    <div className="bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                        <div className={`text-[10px] font-bold uppercase mb-1 ${metrics.savingsRate >= 20 ? 'text-emerald-400' : 'text-slate-400'}`}>Savings</div>
                        <div className="text-lg font-bold">{metrics.savingsRate.toFixed(0)}%</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                        <div className={`text-[10px] font-bold uppercase mb-1 ${metrics.debtServiceRatio < 30 ? 'text-emerald-400' : 'text-red-400'}`}>Debt/Inc</div>
                        <div className="text-lg font-bold">{metrics.debtServiceRatio.toFixed(0)}%</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                        <div className={`text-[10px] font-bold uppercase mb-1 ${metrics.liquidityRatio >= 3 ? 'text-emerald-400' : 'text-slate-400'}`}>Runway</div>
                        <div className="text-lg font-bold">{metrics.liquidityRatio.toFixed(1)}mo</div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Net Worth</span>
                    <Wallet size={16} className="text-violet-500" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(metrics.netWorth, currencySymbol)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Assets - Debts</div>
            </Card>
            
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Invested</span>
                    <TrendingUp size={16} className="text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(metrics.investments, currencySymbol)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                    {((metrics.investments / (metrics.totalAssets || 1)) * 100).toFixed(0)}% of Assets
                </div>
            </Card>
        </div>

        {/* 3. Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Net Worth Trend */}
            <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-violet-500" /> Net Worth Growth
                </h3>
                <div className="h-48 relative">
                    <Line 
                        data={netWorthData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { x: { display: false }, y: { display: false } },
                            interaction: { mode: 'index', intersect: false },
                        }}
                    />
                </div>
            </Card>

            {/* Asset Allocation */}
            <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                    <PieChart size={16} className="text-blue-500" /> Asset Allocation
                </h3>
                <div className="flex items-center">
                    <div className="w-1/2 h-32 relative">
                        <Doughnut 
                            data={assetData} 
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                cutout: '70%'
                            }} 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Total</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.totalAssets, currencySymbol, true)}</span>
                        </div>
                    </div>
                    <div className="flex-1 pl-4 space-y-1.5">
                        {assetData.labels.map((label, i) => {
                            if (assetData.datasets[0].data[i] === 0) return null;
                            return (
                                <div key={i} className="flex justify-between items-center text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: assetData.datasets[0].backgroundColor[i] }}></div>
                                        <span className="text-slate-600 dark:text-slate-300">{label}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {Math.round((assetData.datasets[0].data[i] / metrics.totalAssets) * 100)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>

        {/* 4. Strategic Insights */}
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">AI Insights</h3>
            
            {/* Liquidity Check */}
            {metrics.liquidityRatio < 3 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-500/20 rounded-xl flex gap-3">
                    <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-orange-700 dark:text-orange-300">Boost Emergency Fund</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            You have {metrics.liquidityRatio.toFixed(1)} months of expenses covered. Aim for at least 3 months ({formatCurrency(metrics.monthlyIncome * 3, currencySymbol)}) for better security.
                        </p>
                    </div>
                </div>
            )}

            {/* Investment Opportunity */}
            {metrics.savingsRate > 20 && metrics.liquidityRatio >= 3 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex gap-3">
                    <Briefcase size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Investment Opportunity</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Great savings rate! Since your safety net is solid, consider moving excess cash into higher-yield assets like Stocks or ETFs to beat inflation.
                        </p>
                    </div>
                </div>
            )}

            {/* Debt Warning */}
            {metrics.debtServiceRatio > 30 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20 rounded-xl flex gap-3">
                    <TrendingDown size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-red-700 dark:text-red-300">High Debt Load</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            Debt payments are eating up {metrics.debtServiceRatio.toFixed(0)}% of your income. Focus on paying down high-interest debt to free up cash flow.
                        </p>
                    </div>
                </div>
            )}
            
            {/* General Positive */}
            {healthScore > 75 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex gap-3">
                    <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Financial Wellness</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                            You are in excellent financial shape. Keep maintaining your habits and review your long-term goals in the Planner tab.
                        </p>
                    </div>
                </div>
            )}
        </div>

    </div>
  );
};
