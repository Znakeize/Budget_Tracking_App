
import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/calculations';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Activity, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { BudgetData } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface AnalysisBillsTabProps {
    sortedHistory: BudgetData[];
    currentPeriod: BudgetData;
    currencySymbol: string;
}

export const AnalysisBillsTab: React.FC<AnalysisBillsTabProps> = ({ sortedHistory, currentPeriod, currencySymbol }) => {
    // 1. Calculations
    const totalBills = currentPeriod.bills.reduce((sum, b) => sum + b.amount, 0);
    const paidBills = currentPeriod.bills.filter(b => b.paid).reduce((sum, b) => sum + b.amount, 0);
    const unpaidBills = totalBills - paidBills;
    const paidCount = currentPeriod.bills.filter(b => b.paid).length;
    const totalCount = currentPeriod.bills.length;
    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    // History for trend
    const billHistoryData = sortedHistory.map(h => ({
        period: `${MONTH_NAMES[h.month].substring(0,3)}`,
        amount: h.bills.reduce((sum, b) => sum + b.amount, 0)
    }));

    const previousTotal = billHistoryData.length > 1 ? billHistoryData[billHistoryData.length - 2].amount : totalBills;
    const trendDiff = totalBills - previousTotal;
    const trendPct = previousTotal > 0 ? (trendDiff / previousTotal) * 100 : 0;

    const labels = sortedHistory.map(h => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0, 3) : 'Pd');

    // 2. Charts
    const statusData = {
        labels: ['Paid', 'Unpaid'],
        datasets: [{
            data: [paidBills, unpaidBills],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0,
            cutout: '70%'
        }]
    };

    const trendChartData = {
        labels: labels,
        datasets: [{
            label: 'Total Bills',
            data: sortedHistory.map(h => h.bills.reduce((sum,b) => sum + b.amount, 0)),
            borderColor: '#6366f1',
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 4
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        interaction: { mode: 'index' as const, intersect: false },
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Obligations</p>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(totalBills, currencySymbol)}
                  </div>
                  <div className={`text-[10px] flex items-center gap-1 font-bold mt-1 ${trendDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {trendDiff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(trendPct).toFixed(1)}% vs last month
                  </div>
              </Card>
              <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-emerald-500">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Paid So Far</p>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(paidBills, currencySymbol)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">
                      {paidCount} of {totalCount} bills cleared
                  </div>
              </Card>
          </div>

          {/* Status Breakdown & Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-white">Payment Status</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                          {Math.round(progress)}% Paid
                      </span>
                  </div>
                  <div className="h-40 relative flex justify-center">
                      <Doughnut 
                          data={statusData}
                          options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Pending</span>
                          <span className="text-lg font-bold text-red-500">
                              {formatCurrency(unpaidBills, currencySymbol)}
                          </span>
                      </div>
                  </div>
              </Card>

              {/* Bill Trend */}
              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <Activity size={16} className="text-indigo-500" /> Historical Trend
                  </h3>
                  <div className="h-40 relative">
                      <Line data={trendChartData} options={chartOptions} />
                  </div>
              </Card>
          </div>

          {/* Detailed Bill Analysis */}
          <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white">Bill Analysis</h3>
                  <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                          <CheckCircle size={10} /> Paid
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <AlertCircle size={10} /> Unpaid
                      </span>
                  </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...currentPeriod.bills].sort((a, b) => b.amount - a.amount).map(bill => {
                      // Find historical average for this bill name
                      const billHistory = sortedHistory
                          .map(h => h.bills.find(b => b.name === bill.name)?.amount || 0)
                          .filter(a => a > 0);
                      const avg = billHistory.length > 0 
                          ? billHistory.reduce((a,b) => a+b, 0) / billHistory.length 
                          : bill.amount;
                      
                      const variance = bill.amount - avg;
                      const variancePct = avg > 0 ? (variance / avg) * 100 : 0;
                      const isHigh = variancePct > 10; // 10% higher than avg

                      return (
                          <div key={bill.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bill.paid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                      <FileText size={14} />
                                  </div>
                                  <div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white">{bill.name}</div>
                                      <div className="text-[10px] text-slate-500">Due {new Date(bill.dueDate).toLocaleDateString()}</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className={`text-sm font-bold ${bill.paid ? 'text-emerald-600 dark:text-emerald-400 opacity-70' : 'text-slate-900 dark:text-white'}`}>
                                      {formatCurrency(bill.amount, currencySymbol)}
                                  </div>
                                  {isHigh && billHistory.length > 1 && (
                                      <div className="text-[9px] text-red-500 font-bold flex items-center justify-end gap-0.5">
                                          <TrendingUp size={8} /> +{variancePct.toFixed(0)}% vs avg
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </Card>
      </div>
    );
};
