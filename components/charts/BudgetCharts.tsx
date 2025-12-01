
import React, { useMemo, useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const items = [
        { label: 'Exp', value: totals.totalExpenses, color: '#ec4899' }, // Pink
        { label: 'Bills', value: totals.actualBills, color: '#8b5cf6' }, // Violet
        { label: 'Debt', value: totals.actualDebts, color: '#f97316' }, // Orange
        { label: 'Goals', value: totals.actualGoals, color: '#3b82f6' }, // Blue
        { label: 'Save', value: totals.totalSavings, color: '#10b981' }, // Emerald
        { label: 'Inv', value: totals.actualInvestments, color: '#a855f7' }, // Purple
    ];

    const maxValue = Math.max(...items.map(i => i.value), 1);

    return (
        <div className="w-full h-64 relative pl-0 pr-0 pt-4 pb-0 sm:p-4 overflow-hidden">
            {/* Dynamic CSS for advanced effects */}
            <style>{`
                @keyframes scanline {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.4; transform: scaleX(1); }
                    50% { opacity: 0.8; transform: scaleX(1.2); }
                }
                .glass-bar {
                    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%);
                    backdrop-filter: blur(4px);
                    box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.15);
                }
            `}</style>

            {/* Background Grid Lines */}
            <div className="absolute inset-0 px-6 py-6 flex flex-col justify-between pointer-events-none z-0">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent border-t border-dashed border-white/5"></div>
                ))}
            </div>

            {/* Bars Container */}
            <div className="relative z-10 h-full flex items-end justify-between gap-1 sm:gap-4">
                {items.map((item, idx) => {
                    const percent = (item.value / maxValue) * 100;
                    // Ensure min height for visibility if value exists, otherwise 0
                    const height = mounted && item.value > 0 ? Math.max(percent, 2) : 0;
                    
                    return (
                        <div key={idx} className="group relative flex flex-col items-center justify-end h-full w-full">
                            
                            {/* Value Label (Animated Float In) */}
                            <div 
                                className="absolute z-20 transition-all duration-1000 delay-500 text-[9px] font-bold text-white/90 text-center w-full pointer-events-none transform"
                                style={{ 
                                    bottom: mounted ? `calc(${percent}% + 1px)` : '0%',
                                    opacity: mounted && item.value > 0 ? 1 : 0,
                                    textShadow: `0 0 4px ${item.color}`
                                }}
                            >
                                {item.value > 0 ? (item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value) : ''}
                            </div>

                            {/* The Crystal Bar */}
                            <div 
                                className="relative w-full max-w-[36px] rounded-t-lg transition-all duration-[1200ms] cubic-bezier(0.34, 1.56, 0.64, 1) glass-bar"
                                style={{ 
                                    height: `${height}%`,
                                    border: `1px solid ${item.color}50`, // Border with color opacity
                                    boxShadow: `0 0 3px ${item.color}30, inset 0 0 10px ${item.color}20`
                                }}
                            >
                                {/* Core Color Gradient Fade */}
                                <div 
                                    className="absolute inset-0 opacity-100 rounded-t-lg"
                                    style={{ background: `linear-gradient(to top, ${item.color}, transparent)` }}
                                ></div>

                                {/* Moving Scan Line */}
                                <div 
                                    className="absolute left-0 right-0 h-[2px] bg-white/80 shadow-[0_0_8px_white] z-10 opacity-0"
                                    style={{ 
                                        animation: `scanline 3s ease-in-out infinite`,
                                        animationDelay: `${idx * 0.4}s`
                                    }}
                                ></div>

                                {/* Bottom Energy Beam (Pulsing) */}
                                <div 
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[15px] blur-lg"
                                    style={{ 
                                        backgroundColor: item.color,
                                        animation: 'pulseGlow 3s ease-in-out infinite',
                                        animationDelay: `${idx * 0.2}s`
                                    }}
                                ></div>
                
                                {/* Top Edge Highlight (Rim Light) */}
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/60 shadow-[0_0_6px_white]"></div>
                            </div>

                            {/* Category Label */}
                            <div className="mt-1 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center transition-colors group-hover:text-white group-hover:text-shadow-sm">
                                {item.label}
                            </div>
                            
                            {/* Tooltip Hitbox */}
                            <div className="absolute inset-0 z-30 cursor-help" title={`${item.label}: ${data.currencySymbol}${item.value.toLocaleString()}`}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
