import React from 'react';
import { Trash2, ShoppingCart, Wallet, ShoppingBag, Edit2 } from 'lucide-react';
import { ExpenseItem, ShoppingListData } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface ExpensesSectionProps {
  data: ExpenseItem[];
  currencySymbol: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onDelete: (index: number) => void;
  onEdit: (item: ExpenseItem, index: number) => void;
  shoppingLists: ShoppingListData[];
  onViewShoppingList?: (listId: string, shopId: string) => void;
  t: (key: string) => string;
}

export const ExpensesSection: React.FC<ExpensesSectionProps> = ({ 
  data, 
  currencySymbol, 
  onUpdate, 
  onDelete, 
  onEdit,
  shoppingLists, 
  onViewShoppingList, 
  t 
}) => {
  return (
    <div className="space-y-3">
        {data.map((item, idx) => {
            const linkedShops = shoppingLists.flatMap(l => l.shops.filter(s => s.budgetCategory === item.name).map(s => ({ ...s, listId: l.id })));
            
            // Calculate total from linked shops for visualization
            const shopTotal = linkedShops.reduce((sum, s) => {
                return sum + s.items.filter(i => i.checked).reduce((acc, i) => acc + (i.actualPrice ?? i.price ?? 0), 0);
            }, 0);
            const manualSpent = item.spent - shopTotal;

            return (
            <div key={item.id} id={item.id} className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
                <input 
                    className="bg-transparent font-bold text-lg text-slate-900 dark:text-white outline-none w-full mb-3" 
                    value={item.name} 
                    onChange={(e) => onUpdate(idx, 'name', e.target.value)} 
                    placeholder={t('budget.placeholder.category')}
                />
                <div className="flex gap-3 mb-3">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">{t('budget.label.budget')}</span>
                        <div className="flex items-center">
                            <span className="text-slate-400 text-sm mr-1">{currencySymbol}</span>
                            <input type="number" className="bg-transparent w-full font-semibold outline-none text-slate-700 dark:text-slate-300 min-w-0" 
                                value={item.budgeted || ''} onChange={(e) => onUpdate(idx, 'budgeted', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                    <div className="flex-1 bg-pink-50 dark:bg-pink-900/10 rounded-lg px-3 py-2 border border-pink-100 dark:border-pink-500/20">
                        <span className="text-xs text-pink-500 uppercase font-bold block mb-1">{t('budget.label.spent')}</span>
                        <div className="flex items-center">
                            <span className="text-pink-600/70 text-sm mr-1">{currencySymbol}</span>
                            <input type="number" className="bg-transparent w-full font-bold outline-none text-pink-600 dark:text-pink-400 min-w-0" 
                                value={item.spent || ''} onChange={(e) => onUpdate(idx, 'spent', parseFloat(e.target.value) || 0)} />
                        </div>
                        {linkedShops.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-pink-200/50 dark:border-pink-500/30 flex flex-col gap-0.5">
                                <div className="flex justify-between items-center text-[9px] text-pink-600/80 dark:text-pink-300">
                                    <span className="flex items-center gap-1"><ShoppingCart size={8}/> Lists</span>
                                    <span>{formatCurrency(shopTotal, currencySymbol)}</span>
                                </div>
                                {Math.abs(manualSpent) > 0.01 && (
                                    <div className="flex justify-between items-center text-[9px] text-slate-500/80 dark:text-slate-400">
                                        <span className="flex items-center gap-1"><Wallet size={8}/> Manual</span>
                                        <span>{formatCurrency(manualSpent, currencySymbol)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-1 self-center">
                        <button onClick={() => onEdit(item, idx)} className="text-slate-300 hover:text-indigo-500 p-2 transition-colors"><Edit2 size={20} /></button>
                        <button onClick={() => onDelete(idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                    </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${item.spent > item.budgeted ? 'bg-red-500' : 'bg-pink-500'}`} style={{width: `${Math.min((item.spent/item.budgeted)*100, 100)}%`}}></div>
                </div>
                
                {linkedShops.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {linkedShops.map(shop => (
                            <button 
                                key={shop.id}
                                onClick={() => onViewShoppingList && onViewShoppingList(shop.listId, shop.id)}
                                className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                            >
                                <ShoppingBag size={10} /> Linked: {shop.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )})}
    </div>
  );
};