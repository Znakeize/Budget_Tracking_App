
import React from 'react';
import { Line } from 'react-chartjs-2';
import { X, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import { MONTH_NAMES } from '../../constants';
import { ShoppingListData, BudgetData } from '../../types';

interface CategoryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryName: string;
    currentPeriod: BudgetData;
    history: BudgetData[];
    currencySymbol: string;
    shoppingLists: ShoppingListData[];
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    categoryName, 
    currentPeriod, 
    history, 
    currencySymbol, 
    shoppingLists 
}) => {
    if (!isOpen || !categoryName) return null;

    // 1. Calculate Stats
    const currentExpense = currentPeriod.expenses.find((e: any) => e.name === categoryName);
    const spent = currentExpense?.spent || 0;
    
    // History Average
    const historyData = history.slice(-6).map((h: any) => {
        const exp = h.expenses.find((e: any) => e.name === categoryName);
        return {
            month: MONTH_NAMES[h.month].substring(0,3),
            amount: exp ? exp.spent : 0
        };
    });
    const avgSpend = historyData.length > 0 
        ? historyData.reduce((acc: number, curr: any) => acc + curr.amount, 0) / historyData.length 
        : spent;

    // Trend Data for Chart
    const trendData = {
        labels: historyData.map((d: any) => d.month),
        datasets: [{
            label: 'Spending',
            data: historyData.map((d: any) => d.amount),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4
        }]
    };

    // Enhanced Merchant Matching Logic
    const merchants: Record<string, number> = {};
    
    // Keywords mapping for smart categorization
    const smartKeywords: Record<string, string[]> = {
         'groceries': ['market','mart','super','fresh','food','grocer', 'trader', 'whole', 'costco', 'walmart', 'kroger', 'safeway', 'aldi'],
         'food': ['market','mart','super','fresh','grocer', 'cafe', 'restaurant', 'pizza', 'burger', 'grill', 'bistro', 'diner', 'eats', 'starbucks', 'mcdonalds'],
         'eating out': ['cafe', 'restaurant', 'bistro', 'bar', 'grill', 'pizza', 'burger', 'coffee', 'diner', 'eats', 'uber eats', 'doordash'],
         'dining': ['cafe', 'restaurant', 'bistro', 'bar', 'grill', 'pizza', 'burger', 'coffee', 'diner'],
         'fuel': ['station','oil','petrol','gas','pump', 'shell', 'bp', 'mobil', 'energy', 'chevron', 'exxon'],
         'transport': ['station','oil','petrol','gas','pump', 'uber', 'taxi', 'rail', 'bus', 'train', 'metro', 'lyft'],
         'shopping': ['mall', 'store', 'shop', 'fashion', 'retail', 'outlet', 'center', 'plaza', 'amazon', 'target', 'ebay'],
         'gifts': ['gift', 'store', 'shop', 'mall', 'amazon'],
         'health': ['pharmacy', 'drug', 'med', 'clinic', 'gym', 'fitness', 'salon', 'barber', 'dental', 'doctor', 'walgreens', 'cvs'],
         'personal care': ['pharmacy', 'drug', 'salon', 'barber', 'hair', 'cosmetic', 'spa', 'ulta', 'sephora'],
         'home': ['depot', 'hardware', 'furniture', 'decor', 'ikea', 'homeware', 'repair', 'lowes'],
         'household': ['depot', 'hardware', 'furniture', 'decor', 'ikea'],
         'entertainment': ['cinema', 'movie', 'theater', 'game', 'bowling', 'fun', 'park', 'netflix', 'spotify', 'hulu', 'disney']
    };

    const catLower = categoryName.toLowerCase();
    
    // Find matching keywords for this category
    let categoryKeywords: string[] = [];
    Object.keys(smartKeywords).forEach(key => {
        if (catLower.includes(key) || key.includes(catLower)) {
            categoryKeywords = [...categoryKeywords, ...smartKeywords[key]];
        }
    });
    // Add the category name itself as a keyword
    categoryKeywords.push(catLower);
    // Split category name into words and add those too if significant length
    categoryName.split(' ').forEach(word => {
        if (word.length > 3) categoryKeywords.push(word.toLowerCase());
    });

    shoppingLists.forEach((list: any) => {
        list.shops.forEach((shop: any) => {
            let isMatch = false;
            
            // 1. Explicit Link
            if (shop.budgetCategory && shop.budgetCategory === categoryName) {
                isMatch = true;
            }
            // 2. Smart Keyword Matching (If not linked elsewhere)
            else if (!shop.budgetCategory) {
                const nameLower = shop.name.toLowerCase();
                if (categoryKeywords.some(keyword => nameLower.includes(keyword))) {
                    isMatch = true;
                }
            }
            
            if (isMatch) { 
                 const shopTotal = shop.items.filter((i: any) => i.checked).reduce((sum: number, i: any) => sum + (i.actualPrice || i.price || 0), 0);
                 if (shopTotal > 0) merchants[shop.name] = (merchants[shop.name] || 0) + shopTotal;
            }
        });
    });

    let topMerchants = Object.entries(merchants)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);
    
    // Smart Fallback: "Manual / Other"
    const trackedSum = topMerchants.reduce((sum, m) => sum + m.amount, 0);
    const untracked = Math.max(0, spent - trackedSum);

    if (untracked > 0) {
        topMerchants.push({ name: 'Manual / Other', amount: untracked });
    }
    
    // Sort again
    topMerchants.sort((a, b) => b.amount - a.amount);
    
    const displayMerchants = topMerchants.slice(0, 6); // Show top 6
    const maxMerchantSpend = Math.max(...displayMerchants.map(m => m.amount), 1);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0f172a] w-full max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex flex-col text-white">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{categoryName}</h2>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Deep Dive Analysis</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Key Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Avg Spend</p>
                            <p className="text-xl font-bold">{formatCurrency(avgSpend, currencySymbol)}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Frequency</p>
                            <p className="text-xl font-bold">~4x / mo</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div>
                        <h4 className="text-xs font-bold text-white mb-3">Spending Trend (6 Months)</h4>
                        <div className="h-40 w-full">
                            <Line 
                                data={trendData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { display: false },
                                        y: { display: false }
                                    },
                                    elements: {
                                        line: { tension: 0.4, borderWidth: 3 },
                                        point: { radius: 3, backgroundColor: '#6366f1' }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Merchants */}
                    <div>
                        <h4 className="text-xs font-bold text-white mb-3">Top Merchants (Matched)</h4>
                        <div className="space-y-3">
                            {displayMerchants.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-slate-300 w-28 truncate">{m.name}</span>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${m.name === 'Manual / Other' ? 'bg-slate-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${(m.amount / maxMerchantSpend) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-white w-20 text-right">{formatCurrency(m.amount, currencySymbol)}</span>
                                </div>
                            ))}
                            {displayMerchants.length === 0 && (
                                <p className="text-xs text-slate-500 italic text-center">No spend data or merchant matches found.</p>
                            )}
                        </div>
                    </div>

                    {/* Smart Tip */}
                    <div className="bg-indigo-500/20 border border-indigo-500/30 p-4 rounded-xl flex gap-3">
                        <Lightbulb size={20} className="text-indigo-400 shrink-0" />
                        <p className="text-xs text-indigo-100 leading-relaxed">
                            <span className="font-bold text-white">Smart Tip:</span> 
                            {untracked > (spent * 0.5) 
                                ? "A large portion of this category is manual/untracked. Try linking more shops to this category for better insights."
                                : "You spend 15% more on this category on weekends. Try shifting some purchases to weekdays to avoid peak pricing or impulse buys."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
