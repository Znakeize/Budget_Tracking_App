
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, TrendingUp, TrendingDown, DollarSign, 
  Briefcase, BellRing, Activity, Globe, Plus, Trash2, 
  RefreshCcw, AlertTriangle, CheckCircle, Info, ChevronDown, 
  LayoutGrid, Calculator, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  WifiOff, ArrowLeft, Settings
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, ArcElement, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

interface ForexViewProps {
  onBack: () => void;
  currencySymbol: string;
}

// --- Constants & Types ---

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'LKR', 'SGD', 'NZD'];

const INITIAL_RATES: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 151.5,
    'AUD': 1.52,
    'CAD': 1.36,
    'CHF': 0.90,
    'CNY': 7.23,
    'INR': 83.3,
    'LKR': 305.5,
    'SGD': 1.35,
    'NZD': 1.66
};

// --- Mock Data Generators ---

const generateHistory = (baseRate: number, points: number = 30) => {
    let current = baseRate;
    return Array.from({ length: points }, (_, i) => {
        const change = (Math.random() - 0.5) * 0.02; // 2% volatility
        current = current * (1 + change);
        return current;
    });
};

export const ForexCalculatorView: React.FC<ForexViewProps> = ({ onBack, currencySymbol }) => {
  const [activeTab, setActiveTab] = useState<'convert' | 'analysis' | 'portfolio' | 'alerts'>('convert');
  const [rates, setRates] = useState(INITIAL_RATES);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isOffline, setIsOffline] = useState(false);

  // --- Real-time Simulation ---
  useEffect(() => {
      const interval = setInterval(() => {
          setRates(prev => {
              const newRates = { ...prev };
              Object.keys(newRates).forEach(key => {
                  if (key !== 'USD') {
                      const drift = (Math.random() - 0.5) * 0.001; // Small drift
                      newRates[key] = newRates[key] * (1 + drift);
                  }
              });
              return newRates;
          });
          setLastUpdated(new Date());
      }, 5000); // Update every 5s

      // Random offline toggle simulation
      // const offlineTimer = setTimeout(() => setIsOffline(true), 30000); 

      return () => {
          clearInterval(interval);
          // clearTimeout(offlineTimer);
      };
  }, []);

  const getRate = (from: string, to: string) => {
      return rates[to] / rates[from];
  };

  // --- Render Functions ---

  const renderConverter = () => <ConverterTab rates={rates} lastUpdated={lastUpdated} isOffline={isOffline} />;
  const renderAnalysis = () => <AnalysisTab rates={rates} />;
  const renderPortfolio = () => <PortfolioTab rates={rates} />;
  const renderAlerts = () => <AlertsTab rates={rates} />;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                            Global Markets
                        </h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white flex items-center gap-2">
                            Forex Suite <Globe size={20} className="text-slate-400" />
                        </h1>
                    </div>
                </div>
                <div className="pb-1 text-right">
                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 uppercase">
                        {isOffline ? (
                            <span className="flex items-center gap-1 text-orange-500"><WifiOff size={10} /> Offline Mode</span>
                        ) : (
                            <span className="flex items-center gap-1 text-emerald-500"><Activity size={10} /> Live Feed</span>
                        )}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                        {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0">
                {[
                    { id: 'convert', label: 'Convert', icon: ArrowLeftRight },
                    { id: 'analysis', label: 'Trading', icon: BarChart3 },
                    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
                    { id: 'alerts', label: 'Alerts', icon: BellRing },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[80px] flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeTab === 'convert' && renderConverter()}
           {activeTab === 'analysis' && renderAnalysis()}
           {activeTab === 'portfolio' && renderPortfolio()}
           {activeTab === 'alerts' && renderAlerts()}
       </div>
    </div>
  );
};

// --- Sub-Components ---

const ConverterTab = ({ rates, lastUpdated, isOffline }: any) => {
    const [amount, setAmount] = useState<number>(1000);
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('EUR');
    
    const rate = rates[to] / rates[from];
    const result = amount * rate;
    
    // Calculate inverse
    const inverseRate = 1 / rate;

    // Simulate History for Chart
    const historyData = useMemo(() => {
        const data = generateHistory(rate, 15);
        // Ensure last point matches current rate for continuity
        data[data.length - 1] = rate;
        return {
            labels: Array(15).fill(''),
            datasets: [{
                data: data,
                borderColor: data[data.length-1] >= data[0] ? '#10b981' : '#ef4444',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            }]
        };
    }, [rate, from, to]);

    // Top Movers Mock
    const movers = [
        { pair: 'GBP/USD', change: 0.45 },
        { pair: 'USD/JPY', change: -0.23 },
        { pair: 'EUR/USD', change: 0.12 },
        { pair: 'AUD/USD', change: -0.56 },
    ];

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* Main Converter Card */}
            <Card className="p-5 border-none shadow-xl bg-white dark:bg-slate-800">
                <div className="flex flex-col gap-4">
                    
                    {/* From Input */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">You Pay</span>
                            <span className="text-xs font-bold text-slate-500">{from} Balance: 5,000.00</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="bg-transparent text-2xl font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-4"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-2xl font-bold text-right text-slate-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="relative h-4 flex items-center justify-center -my-2 z-10">
                        <button 
                            onClick={handleSwap}
                            className="bg-emerald-600 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-slate-800 hover:scale-110 transition-transform"
                        >
                            <ArrowLeftRight size={18} />
                        </button>
                    </div>

                    {/* To Output */}
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">You Get</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Activity size={10} /> 1 {from} = {rate.toFixed(4)} {to}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="bg-transparent text-2xl font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer pr-4"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="w-full text-2xl font-bold text-right text-slate-900 dark:text-white truncate">
                                {result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mini Chart */}
                <div className="mt-6 h-24 w-full">
                    <Line 
                        data={historyData} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { enabled: false } },
                            scales: { x: { display: false }, y: { display: false } },
                            elements: { point: { radius: 0 } }
                        }} 
                    />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                    <span>24h Low: {(rate * 0.98).toFixed(4)}</span>
                    <span>24h High: {(rate * 1.02).toFixed(4)}</span>
                </div>
            </Card>

            {/* Top Movers */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase ml-1">Today's Top Movers</h3>
                <div className="grid grid-cols-2 gap-3">
                    {movers.map((m) => (
                        <div key={m.pair} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.pair}</span>
                            <span className={`text-xs font-bold ${m.change > 0 ? 'text-emerald-500' : 'text-red-500'} flex items-center gap-0.5`}>
                                {m.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {Math.abs(m.change)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Offline Warning */}
            {isOffline && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-500/20 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={18} className="text-orange-500" />
                    <div>
                        <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400">Offline Mode Active</h4>
                        <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80">Rates may not be accurate. Showing cached data.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalysisTab = ({ rates }: any) => {
    const [pair, setPair] = useState('EUR/USD');
    const [lotSize, setLotSize] = useState(1.0); // Standard Lot
    const [entryPrice, setEntryPrice] = useState(1.0850);
    const [exitPrice, setExitPrice] = useState(1.0900);
    const [position, setPosition] = useState<'long' | 'short'>('long');
    
    // Calculations
    const pipDiff = position === 'long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    const pips = pipDiff * 10000; // For most pairs
    const profit = pips * 10 * lotSize; // Approx for USD pairs

    // Chart Data
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Rate',
            data: [1.05, 1.06, 1.04, 1.07, 1.08, 1.09], // Mock
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
        }]
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* P&L Calculator */}
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white">Profit & Loss Calculator</h3>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Currency Pair</label>
                            <select 
                                value={pair} onChange={e => setPair(e.target.value)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                            >
                                <option>EUR/USD</option>
                                <option>GBP/USD</option>
                                <option>USD/JPY</option>
                                <option>AUD/USD</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Position</label>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                <button 
                                    onClick={() => setPosition('long')}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${position === 'long' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
                                >
                                    Long
                                </button>
                                <button 
                                    onClick={() => setPosition('short')}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${position === 'short' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}
                                >
                                    Short
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Lot Size</label>
                            <input 
                                type="number" step="0.01" 
                                value={lotSize} onChange={e => setLotSize(parseFloat(e.target.value))}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Entry</label>
                            <input 
                                type="number" step="0.0001" 
                                value={entryPrice} onChange={e => setEntryPrice(parseFloat(e.target.value))}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Exit</label>
                            <input 
                                type="number" step="0.0001" 
                                value={exitPrice} onChange={e => setExitPrice(parseFloat(e.target.value))}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                            />
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl flex justify-between items-center ${profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-500/20'}`}>
                        <div>
                            <p className="text-[10px] font-bold uppercase opacity-70">Total Profit/Loss</p>
                            <h3 className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {profit >= 0 ? '+' : ''}{profit.toFixed(2)} USD
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase opacity-70">Pips</p>
                            <p className="text-sm font-bold">{pips.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Historical Chart */}
            <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" /> Market Trends
                    </h3>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                        {['1D', '1W', '1M', '1Y'].map(tf => (
                            <button key={tf} className={`px-2 py-0.5 text-[9px] font-bold rounded ${tf === '1M' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-48 relative">
                    <Line 
                        data={chartData} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { x: { grid: { display: false } }, y: { display: true } }
                        }}
                    />
                </div>
            </Card>
        </div>
    );
};

const PortfolioTab = ({ rates }: any) => {
    const [holdings, setHoldings] = useState([
        { id: 1, currency: 'USD', amount: 1500 },
        { id: 2, currency: 'EUR', amount: 800 },
        { id: 3, currency: 'JPY', amount: 50000 },
    ]);
    const [baseCurrency, setBaseCurrency] = useState('LKR'); // Assuming user wants to see total in local currency

    const totalValue = holdings.reduce((sum, h) => {
        // Convert to base: (Amount / Rate(Currency->USD)) * Rate(Base->USD) 
        // Logic: All rates are relative to USD in our mock
        // Rate X = X per USD.
        // Amount USD = Amount / Rate X ? No. Rate is X per 1 USD. So 100 EUR (0.92 per USD) -> 100/0.92 USD.
        // Wait, normally rates are 1 USD = 0.92 EUR. So 1 EUR = 1/0.92 USD.
        
        const valueInUSD = h.currency === 'USD' ? h.amount : h.amount / rates[h.currency];
        const valueInBase = valueInUSD * rates[baseCurrency];
        return sum + valueInBase;
    }, 0);

    const allocationData = {
        labels: holdings.map(h => h.currency),
        datasets: [{
            data: holdings.map(h => {
                const valueInUSD = h.currency === 'USD' ? h.amount : h.amount / rates[h.currency];
                return valueInUSD * rates[baseCurrency];
            }),
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* Total Value Card */}
            <Card className="p-5 bg-slate-900 text-white border-none shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Portfolio Value</p>
                        <h2 className="text-3xl font-bold">{totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base font-normal text-slate-400">{baseCurrency}</span></h2>
                    </div>
                    <div className="p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20">
                        <Settings size={20} />
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {holdings.slice(0,3).map(h => (
                        <div key={h.id} className="bg-white/10 px-2 py-1 rounded text-xs">
                            {h.currency} {h.amount.toLocaleString()}
                        </div>
                    ))}
                    {holdings.length > 3 && <div className="bg-white/10 px-2 py-1 rounded text-xs">+{holdings.length - 3}</div>}
                </div>
            </Card>

            {/* Holdings List */}
            <div>
                <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Your Assets</h3>
                    <button className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Plus size={14} /> Add Asset
                    </button>
                </div>
                <div className="space-y-2">
                    {holdings.map(h => {
                        const valInBase = (h.currency === 'USD' ? h.amount : h.amount / rates[h.currency]) * rates[baseCurrency];
                        return (
                            <Card key={h.id} className="p-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                                        {h.currency}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">{h.amount.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500">1 {h.currency} = {(rates[baseCurrency]/rates[h.currency]).toFixed(2)} {baseCurrency}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                        {valInBase.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px]">{baseCurrency}</span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Allocation Chart */}
            <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Currency Allocation</h3>
                <div className="h-40 relative flex justify-center">
                    <Doughnut 
                        data={allocationData} 
                        options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }, cutout: '70%' }}
                    />
                </div>
            </Card>
        </div>
    );
};

const AlertsTab = ({ rates }: any) => {
    const [alerts, setAlerts] = useState([
        { id: 1, pair: 'USD/LKR', target: 350, condition: 'above', active: true },
        { id: 2, pair: 'EUR/USD', target: 1.10, condition: 'above', active: true },
        { id: 3, pair: 'GBP/USD', target: 1.20, condition: 'below', active: false },
    ]);

    const toggleAlert = (id: number) => {
        setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
    };

    const deleteAlert = (id: number) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* AI Insights Header */}
            <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex gap-3">
                    <AlertTriangle className="text-indigo-500 shrink-0 mt-1" size={18} />
                    <div>
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Market Insight</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                            "LKR has depreciated 3.2% this month against USD. Consider adjusting your holdings if the trend continues."
                        </p>
                    </div>
                </div>
            </Card>

            <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Active Alerts</h3>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    <Plus size={14} /> New Alert
                </button>
            </div>

            <div className="space-y-3">
                {alerts.map(alert => {
                    // Calculate current rate for context
                    const [base, quote] = alert.pair.split('/');
                    const currentRate = rates[quote] / rates[base];
                    const isTriggered = alert.condition === 'above' ? currentRate >= alert.target : currentRate <= alert.target;

                    return (
                        <Card key={alert.id} className={`p-4 transition-all ${alert.active ? 'opacity-100' : 'opacity-60 grayscale'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isTriggered ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        <BellRing size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white">{alert.pair}</h4>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{alert.condition} {alert.target}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Current: {currentRate.toFixed(2)}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleAlert(alert.id)}
                                        className={`w-10 h-6 rounded-full relative transition-colors ${alert.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${alert.active ? 'left-5' : 'left-1'}`}></div>
                                    </button>
                                    <button onClick={() => deleteAlert(alert.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
