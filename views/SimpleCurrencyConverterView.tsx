
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowLeftRight, RefreshCcw, TrendingUp, 
  Globe, DollarSign, Clock 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { HeaderProfile } from '../components/ui/HeaderProfile';

interface SimpleCurrencyConverterViewProps {
  onBack: () => void;
  currencySymbol: string;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
];

const MOCK_RATES: Record<string, number> = {
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
};

export const SimpleCurrencyConverterView: React.FC<SimpleCurrencyConverterViewProps> = ({ onBack, currencySymbol }) => {
  const [amount, setAmount] = useState<string>('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('LKR');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRotating, setIsRotating] = useState(false);

  // Conversion Logic
  const rate = (MOCK_RATES[to] || 1) / (MOCK_RATES[from] || 1);
  const result = (parseFloat(amount) || 0) * rate;

  const handleSwap = () => {
    setIsRotating(true);
    setFrom(to);
    setTo(from);
    setTimeout(() => setIsRotating(false), 500);
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // In a real app, this would fetch new rates
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                Tools
              </h2>
              <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white flex items-center gap-2">
                Currency Converter
              </h1>
            </div>
          </div>
          <div className="pb-1">
             <HeaderProfile />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 animate-in fade-in slide-in-from-right-4">
        
        {/* Main Converter Card */}
        <Card className="p-6 bg-white dark:bg-slate-800 shadow-xl border-none ring-1 ring-slate-200 dark:ring-slate-700">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Clock size={12} /> Rates updated: {lastUpdated.toLocaleTimeString()}
             </div>
             <button onClick={handleRefresh} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors">
                <RefreshCcw size={16} />
             </button>
          </div>

          <div className="space-y-6">
            {/* From Input */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">From</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 transition-colors">
                 <div className="min-w-[100px]">
                    <select 
                      value={from} 
                      onChange={(e) => setFrom(e.target.value)}
                      className="w-full bg-transparent font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                 </div>
                 <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                 <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-right font-mono text-xl font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-300"
                    placeholder="0.00"
                 />
              </div>
            </div>

            {/* Swap Button */}
            <div className="relative h-4 flex items-center justify-center -my-3 z-10">
               <button 
                  onClick={handleSwap}
                  className={`bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-slate-800 transition-all ${isRotating ? 'rotate-180' : ''}`}
               >
                  <ArrowLeftRight size={20} />
               </button>
            </div>

            {/* To Output */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">To</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                 <div className="min-w-[100px]">
                    <select 
                      value={to} 
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full bg-transparent font-bold text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                 </div>
                 <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                 <div className="w-full text-right font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div className="text-xs text-slate-500">
                1 {from} = {rate.toFixed(4)} {to}
             </div>
             <div className="text-xs text-slate-500">
                1 {to} = {(1/rate).toFixed(4)} {from}
             </div>
          </div>
        </Card>

        {/* Popular Rates */}
        <div>
           <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 ml-1 flex items-center gap-2">
              <Globe size={16} className="text-emerald-500" /> Popular Conversions
           </h3>
           <div className="grid grid-cols-2 gap-3">
              {[
                { pair: 'USD/EUR', val: MOCK_RATES['EUR'] },
                { pair: 'USD/GBP', val: MOCK_RATES['GBP'] },
                { pair: 'USD/JPY', val: MOCK_RATES['JPY'] },
                { pair: 'USD/LKR', val: MOCK_RATES['LKR'] },
              ].map((item) => (
                 <div key={item.pair} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.pair}</span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{item.val.toFixed(2)}</span>
                 </div>
              ))}
           </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex gap-3">
           <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
           <div>
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">Exchange Tip</h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                 Exchange rates fluctuate constantly. This tool provides indicative market rates. Actual rates from banks may vary by 3-5%.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};
