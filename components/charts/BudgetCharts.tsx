import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { BudgetData } from '../../types';
import { calculateTotals } from '../../utils/calculations';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ChartProps {
  data: BudgetData;
}

export const OverviewChart: React.FC<ChartProps> = ({ data }) => {
  const totals = calculateTotals(data);
  const chartData = {
    labels: ['Income', 'Spent'],
    datasets: [
      {
        data: [totals.totalIncome + (data.rollover || 0), totals.totalOut],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="h-40 relative">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-slate-400">Net</span>
        <span className={`text-lg font-bold ${totals.leftToSpend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {data.currencySymbol}{Math.round(totals.leftToSpend)}
        </span>
      </div>
    </div>
  );
};

export const ExpenseBreakdown: React.FC<ChartProps> = ({ data }) => {
    const totals = calculateTotals(data);
    const chartData = {
        labels: ['Exp', 'Bills', 'Debt', 'Goals', 'Save', 'Inv'],
        datasets: [{
            label: 'Amount',
            data: [totals.totalExpenses, totals.totalBills, totals.totalDebts, totals.totalGoals, totals.totalSavings, totals.totalInvestments],
            backgroundColor: [
                'rgba(236, 72, 153, 0.7)', 
                'rgba(139, 92, 246, 0.7)',
                'rgba(249, 115, 22, 0.7)',
                'rgba(59, 130, 246, 0.7)', // Blue for Goals
                'rgba(16, 185, 129, 0.7)',
                'rgba(167, 139, 250, 0.7)' // Violet for Investments
            ],
            borderRadius: 4,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
    };

    return (
        <div className="h-48 w-full">
            <Bar data={chartData} options={options} />
        </div>
    );
}