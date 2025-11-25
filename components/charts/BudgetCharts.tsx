
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
            // Use ACTUALS here for the breakdown chart to show what has been spent/paid
            data: [
                totals.totalExpenses, 
                totals.actualBills, 
                totals.actualDebts, 
                totals.actualGoals, 
                totals.totalSavings, 
                totals.actualInvestments
            ],
            backgroundColor: [
                'rgba(236, 72, 153, 0.8)', // Pink
                'rgba(139, 92, 246, 0.8)', // Violet
                'rgba(249, 115, 22, 0.8)', // Orange
                'rgba(59, 130, 246, 0.8)', // Blue
                'rgba(16, 185, 129, 0.8)', // Emerald
                'rgba(167, 139, 250, 0.8)'  // Light Purple
            ],
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 'flex' as const,
            maxBarThickness: 32
        }]
    }), [totals]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `${context.parsed.y}`
                }
            }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                grid: { 
                    color: 'rgba(148, 163, 184, 0.1)', // Visible in both light/dark
                    drawBorder: false 
                }, 
                ticks: { 
                    color: '#94a3b8', 
                    font: { size: 10, family: "'Inter', sans-serif" } 
                },
                border: { display: false }
            },
            x: { 
                grid: { display: false }, 
                ticks: { 
                    color: '#94a3b8', 
                    font: { size: 10, family: "'Inter', sans-serif", weight: 'bold' } 
                },
                border: { display: false }
            }
        },
        animation: {
            duration: 500
        }
    }), []);

    return (
        <div className="h-48 w-full">
            <Bar data={chartData} options={options as any} />
        </div>
    );
}
