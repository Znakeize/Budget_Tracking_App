
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ArrowLeftRight, RefreshCcw, TrendingUp, 
  Globe, DollarSign, Clock, Bell, History, Settings, 
  WifiOff, BarChart3, Search, ChevronDown, Check,
  AlertTriangle, Sparkles, LayoutGrid, Trash2, Smartphone, Plus,
  ArrowRight, Activity, Calendar
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { HeaderProfile } from '../components/ui/HeaderProfile';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface CurrencySystemProps {
  onBack: () => void;
  currencySymbol: string;
  onProfileClick?: () => void;
}

// --- Constants ---

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'LKR', name: 'Sri Lankan Rupee', flag: '🇱🇰', symbol: 'Rs' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: '$' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'dh' },
];

const INITIAL_RATES: Record<string, number> = {
  'USD': 1,
  'EUR': 0.92,
  'GBP': 0.79,
  'JPY': 151.5,
  'LKR': 327.00,
  'INR': 83.3,
  'AUD': 1.52,
  'CAD': 1.36,
  'CNY': 7.23,
  'AED': 3.67,
};

// --- Helper Functions ---

const generateHistoryData = (baseRate: number, points: number = 30) => {
    let current = baseRate;
    return Array.from({ length: points }, () => {
        const change = (Math.random() - 0.5) * 0.02; // 2% volatility
        current = current * (1 + change);
        return current;
    });
};

export const SimpleCurrencyConverterView: React.FC<CurrencySystemProps> = ({ onBack, currencySymbol, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'converter' | 'charts' | 'alerts' | 'settings'>('dashboard');
  
  // Core State
  const [rates, setRates] = useState(INITIAL_RATES);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isOffline, setIsOffline] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState('USD');

  // Converter State
  const [amount, setAmount] = useState<string>('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('LKR');
  const [historyLog, setHistoryLog] = useState<{id: string, from: string, to: string, amount: number, result: number, date: string}[]>([]);

  // Alerts State
  const [alerts, setAlerts] = useState<{id: string, pair: string, target: number, condition: 'above' | 'below', active: boolean}[]>([
      { id: '1', pair: 'USD/LKR', target: 330.00, condition: 'above', active: true },
      { id: '2', pair: 'EUR/USD', target: 1.05, condition: 'below', active: true }
  ]);

  // Settings State
  const [updateFreq, setUpdateFreq] = useState(5); // seconds

  // Real-time Simulation
  useEffect(() => {
      const interval = setInterval(() => {
          if (!isOffline) {
              setRates(prev => {
                  const next = { ...prev };
                  Object.keys(next).forEach(key => {
                      if (key !== 'USD') {
                          const drift = (Math.random() - 0.5) * 0.002; // 0.2% drift
                          next[key] = next[key] * (1 + drift);
                      }
                  });
                  return next;
              });
              setLastUpdated(new Date());
          }
      }, updateFreq * 1000);
      return () => clearInterval(interval);
  }, [isOffline, updateFreq]);

  // --- Sub-Components ---

  const renderDashboard = () => {
      const rate = (rates[to] / rates[from]);
      
      const compareCurrencies = ['EUR', 'GBP', 'JPY', 'LKR'].filter(c => c !== baseCurrency).slice(0, 3);

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {/* Main Quick Converter Card */}
              <Card className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h2 className="text-sm font-bold opacity-80 uppercase tracking-wider">Quick Convert</h2>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-3xl font-bold">1 {from}</span>
                              <ArrowRight size={20} className="opacity-60" />
                              <span className="text-3xl font-bold text-emerald-300">{rate.toFixed(2)} {to}</span>
                          </div>
                      </div>
                      <button onClick={() => { const temp = from; setFrom(to); setTo(temp); }} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                          <RefreshCcw size={18} />
                      </button>
                  </div>

                  <div className="space-y-3">
                      <div className="flex items-center gap-3">
                          <select 
                              value={from} onChange={e => setFrom(e.target.value)}
                              className="bg-white/10 text-white border border-white/20 rounded-xl p-2 text-sm font-bold outline-none"
                          >
                              {CURRENCIES.map(c => <option key={c.code} value={c.code} className="text-slate-900">{c.code}</option>)}
                          </select>
                          <input 
                              type="number" value={amount} onChange={e => setAmount(e.target.value)}
                              className="flex-1 bg-white/10 border border-white/20 rounded-xl p-2 text-right text-lg font-bold text-white outline-none placeholder:text-white/50"
                          />
                      </div>
                      <div className="flex items-center gap-3">
                          <select 
                              value={to} onChange={e => setTo(e.target.value)}
                              className="bg-white/10 text-white border border-white/20 rounded-xl p-2 text-sm font-bold outline-none"
                          >
                              {CURRENCIES.map(c => <option key={c.code} value={c.code} className="text-slate-900">{c.code}</option>)}
                          </select>
                          <div className="flex-1 bg-white/20 border border-white/20 rounded-xl p-2.5 text-right text-lg font-bold text-emerald-300">
                              {((parseFloat(amount)||0) * rate).toFixed(2)}
                          </div>
                      </div>
                  </div>
              </Card>

              {/* Live Rates */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1 flex items-center gap-2">
                      <Activity size={14} /> Live Rates (1 {baseCurrency})
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                      {compareCurrencies.map(code => {
                          const r = rates[code] / rates[baseCurrency];
                          const change = (Math.random() - 0.5) * 2; // Sim change
                          return (
                              <div key={code} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <span className="text-2xl">{CURRENCIES.find(c=>c.code===code)?.flag}</span>
                                      <div>
                                          <h4 className="font-bold text-slate-900 dark:text-white">{code}</h4>
                                          <p className="text-xs text-slate-500">{CURRENCIES.find(c=>c.code===code)?.name}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">{r.toFixed(2)}</div>
                                      <div className={`text-[10px] font-bold ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Recent Conversions */}
              <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                      <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><History size={14} /> Recent</h3>
                      {historyLog.length > 0 && <button onClick={() => setHistoryLog([])} className="text-xs text-red-500 font-bold">Clear</button>}
                  </div>
                  {historyLog.length > 0 ? (
                      <div className="space-y-2">
                          {historyLog.slice(0, 3).map(log => (
                              <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex justify-between items-center text-sm">
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">{log.amount} {log.from} → {log.to}</span>
                                  <span className="font-bold text-slate-900 dark:text-white">{log.result.toFixed(2)}</span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-center text-xs text-slate-400 py-4 italic">No recent conversions</p>
                  )}
              </div>
          </div>
      );
  };

  const renderConverterPage = () => {
      const rate = rates[to] / rates[from];
      const result = (parseFloat(amount) || 0) * rate;
      const invRate = 1 / rate;

      const saveConversion = () => {
          setHistoryLog(prev => [{
              id: Date.now().toString(),
              from, to,
              amount: parseFloat(amount) || 0,
              result,
              date: new Date().toLocaleDateString()
          }, ...prev]);
      };

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                  {/* From Section */}
                  <div className="mb-6">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Amount</label>
                      <div className="flex gap-4 items-center">
                          <select 
                              value={from} onChange={e => setFrom(e.target.value)}
                              className="text-2xl font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                          </select>
                          <input 
                              type="number" 
                              value={amount} onChange={e => setAmount(e.target.value)}
                              className="flex-1 text-4xl font-bold text-right bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300"
                              placeholder="0"
                          />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{CURRENCIES.find(c => c.code === from)?.name}</div>
                  </div>

                  {/* Swap Divider */}
                  <div className="relative h-px bg-slate-200 dark:bg-slate-700 my-6 flex items-center justify-center">
                      <button 
                          onClick={() => { const t = from; setFrom(to); setTo(t); }}
                          className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                          <ArrowLeftRight size={20} />
                      </button>
                  </div>

                  {/* To Section */}
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Converted</label>
                      <div className="flex gap-4 items-center">
                          <select 
                              value={to} onChange={e => setTo(e.target.value)}
                              className="text-2xl font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                          </select>
                          <div className="flex-1 text-4xl font-bold text-right text-emerald-500 truncate">
                              {result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{CURRENCIES.find(c => c.code === to)?.name}</div>
                  </div>
              </div>

              {/* Details Card */}
              <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-700 dark:text-white text-sm">Rate Details</h4>
                      <span className="text-[10px] text-slate-400">{lastUpdated.toLocaleTimeString()}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                          <span className="text-slate-500">1 {from} =</span>
                          <span className="font-bold text-slate-900 dark:text-white">{rate.toFixed(6)} {to}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-slate-500">1 {to} =</span>
                          <span className="font-bold text-slate-900 dark:text-white">{invRate.toFixed(6)} {from}</span>
                      </div>
                  </div>
                  <button onClick={saveConversion} className="w-full mt-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                      Save to History
                  </button>
              </Card>
          </div>
      );
  };

  const renderCharts = () => {
      const rate = rates[to] / rates[from];
      const dataPoints = generateHistoryData(rate);
      const data = {
          labels: Array(30).fill(''),
          datasets: [{
              label: `${from}/${to}`,
              data: dataPoints,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 0
          }]
      };

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <Card className="p-4 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-900 dark:text-white">{from} / {to} Trends</h3>
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                          {['1D', '1W', '1M', '1Y'].map(tf => (
                              <button key={tf} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${tf === '1M' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}>{tf}</button>
                          ))}
                      </div>
                  </div>
                  <div className="h-64 relative w-full">
                      <Line data={data} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: true } } }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div><p className="text-[10px] text-slate-400 font-bold uppercase">Low</p><p className="font-bold text-red-500">{Math.min(...dataPoints).toFixed(4)}</p></div>
                      <div><p className="text-[10px] text-slate-400 font-bold uppercase">Avg</p><p className="font-bold text-slate-700 dark:text-slate-300">{(dataPoints.reduce((a,b)=>a+b,0)/30).toFixed(4)}</p></div>
                      <div><p className="text-[10px] text-slate-400 font-bold uppercase">High</p><p className="font-bold text-emerald-500">{Math.max(...dataPoints).toFixed(4)}</p></div>
                  </div>
              </Card>
          </div>
      );
  };

  const renderSettings = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-4 flex justify-between items-center">
                  <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Base Currency</h4>
                      <p className="text-xs text-slate-500">Default for comparison</p>
                  </div>
                  <select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold outline-none">
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
              </div>
              <div className="p-4 flex justify-between items-center">
                  <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Offline Mode</h4>
                      <p className="text-xs text-slate-500">Use cached rates</p>
                  </div>
                  <button onClick={() => setIsOffline(!isOffline)} className={`w-10 h-6 rounded-full relative transition-colors ${isOffline ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isOffline ? 'left-5' : 'left-1'}`}></div>
                  </button>
              </div>
              <div className="p-4 flex justify-between items-center">
                  <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Update Frequency</h4>
                      <p className="text-xs text-slate-500">Seconds</p>
                  </div>
                  <input type="number" value={updateFreq} onChange={e => setUpdateFreq(parseInt(e.target.value))} className="w-16 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold text-center outline-none" />
              </div>
          </Card>
      </div>
  );

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                            Tools
                        </h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white flex items-center gap-2">
                            Currency System {isOffline && <WifiOff size={16} className="text-orange-500"/>}
                        </h1>
                    </div>
                </div>
                <div className="pb-1 text-right">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
                    { id: 'converter', label: 'Converter', icon: ArrowLeftRight },
                    { id: 'charts', label: 'History', icon: BarChart3 },
                    { id: 'alerts', label: 'Alerts', icon: Bell },
                    { id: 'settings', label: 'Settings', icon: Settings },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[80px] flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeTab === 'dashboard' && renderDashboard()}
           {activeTab === 'converter' && renderConverterPage()}
           {activeTab === 'charts' && renderCharts()}
           {activeTab === 'alerts' && <CurrencyAlertsTab alerts={alerts} setAlerts={setAlerts} />}
           {activeTab === 'settings' && renderSettings()}
       </div>
    </div>
  );
};

const CurrencyAlertsTab = ({ alerts, setAlerts }: { alerts: any[], setAlerts: (a: any[]) => void }) => {
  const [newPair, setNewPair] = useState('USD/EUR');
  const [newTarget, setNewTarget] = useState('');

  const addAlert = () => {
      if(!newTarget) return;
      setAlerts([...alerts, { id: Date.now().toString(), pair: newPair, target: parseFloat(newTarget), condition: 'above', active: true }]);
      setNewTarget('');
  };

  return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Create Alert</h3>
              <div className="flex gap-3 mb-3">
                  <select className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold outline-none flex-1" value={newPair} onChange={e => setNewPair(e.target.value)}>
                      {['USD/LKR', 'USD/EUR', 'USD/GBP', 'EUR/USD', 'GBP/USD', 'USD/JPY'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold outline-none flex-1" placeholder="Target Rate" type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} />
              </div>
              <button onClick={addAlert} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">Set Alert</button>
          </Card>

          <div className="space-y-3">
              {alerts.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No active alerts</p>}
              {alerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${alert.active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}><Bell size={16} /></div>
                          <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{alert.pair}</h4>
                              <p className="text-xs text-slate-500">{alert.condition} {alert.target.toFixed(2)}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Toggle */}
                        <button 
                            onClick={() => setAlerts(alerts.map(a => a.id === alert.id ? {...a, active: !a.active} : a))}
                            className={`w-8 h-5 rounded-full relative transition-colors ${alert.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${alert.active ? 'left-4' : 'left-1'}`}></div>
                        </button>
                        <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
};
