
import React, { useMemo } from 'react';
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
  
  const chartData = useMemo(() => ({
    labels: ['Income', 'Spent'],
    datasets: [
      {
        data: [totals.totalIncome + (data.rollover || 0), totals.totalOut],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  }), [totals, data.rollover]);

  const options = useMemo(() => ({
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    maintainAspectRatio: false,
    animation: {
        animateScale: true,
        animateRotate: true
    }
  }), []);

  return (
    <div className="h-40 relative">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] text-slate-400 uppercase font-bold">Net</span>
        <span className={`text-lg font-bold ${totals.leftToSpend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {data.currencySymbol}{Math.round(totals.leftToSpend)}
        </span>
      </div>
    </div>
  );
};

export const ExpenseBreakdown: React.FC<ChartProps> = ({ data }) => {
    const totals = calculateTotals(data);
    
    const chartData = useMemo(() => ({
        labels: ['Exp', 'Bills', 'Debt', 'Goals', 'Save', 'Inv'],
        datasets: [{
            label: 'Amount',
            data: [
                totals.totalExpenses, 
                totals.actualBills, 
                totals.actualDebts, 
                totals.actualGoals, 
                totals.totalSavings, 
                totals.actualInvestments
            ],
            backgroundColor: [
                '#ec4899', // Pink
                '#8b5cf6', // Violet
                '#f97316', // Orange
                '#3b82f6', // Blue
                '#10b981', // Emerald
                '#a855f7'  // Light Purple
            ],
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 28,
            hoverBackgroundColor: [
                '#f472b6', 
                '#a78bfa', 
                '#fb923c', 
                '#60a5fa', 
                '#34d399', 
                '#c084fc'
            ]
        }]
    }), [totals]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 12,
                cornerRadius: 12,
                titleFont: { size: 13, family: "'Inter', sans-serif" },
                bodyFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' },
                displayColors: false,
                callbacks: {
                    label: (context: any) => `${data.currencySymbol}${context.parsed.y.toLocaleString()}`
                }
            }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                grid: { 
                    color: 'rgba(148, 163, 184, 0.05)', 
                    drawBorder: false 
                }, 
                ticks: { 
                    color: '#94a3b8', 
                    font: { size: 10, family: "'Inter', sans-serif" },
                    callback: (value: any) => value >= 1000 ? `${value/1000}k` : value
                },
                border: { display: false }
            },
            x: { 
                grid: { display: false }, 
                ticks: { 
                    color: '#64748b', 
                    font: { size: 11, family: "'Inter', sans-serif", weight: 'bold' } 
                },
                border: { display: false }
            }
        },
        animation: {
            duration: 1200,
            easing: 'easeOutQuart'
        },
        layout: {
            padding: { top: 10 }
        }
    }), [data.currencySymbol]);

    return (
        <div className="h-56 w-full relative">
            {/* Filter drop-shadow applies to non-transparent parts (the bars), creating a glow effect */}
            <div style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.15))' }}>
                 <Bar data={chartData} options={options as any} />
            </div>
        </div>
    );
}
