import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag, ChevronDown, Check, Trash2 } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { generateId } from '../../utils/calculations';
import { SharedGroup, SharedExpense, SharedMember } from '../../types';

interface AddSharedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expense: SharedExpense) => void;
  group: SharedGroup;
  initialData?: SharedExpense | null;
  onCreateShoppingList?: (groupName: string, expenseName: string, amount: number, members: SharedMember[], linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string}) => void;
  onDelete?: () => void;
}

export const AddSharedExpenseModal: React.FC<AddSharedExpenseModalProps> = ({ isOpen, onClose, onConfirm, group, initialData, onCreateShoppingList, onDelete }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('me');
    const [category, setCategory] = useState('General');
    
    // Split States
    const [splitMode, setSplitMode] = useState<'equal' | 'unequal' | 'percent'>('equal');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [manualSplits, setManualSplits] = useState<Record<string, string>>({}); // Stores input strings for unequal/percent
    const [createList, setCreateList] = useState(false);
    
    // Ref to track previous amount to enable auto-scaling in 'unequal' mode
    const prevAmountRef = useRef(0);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setAmount(initialData.amount.toString());
                setPaidBy(initialData.paidBy);
                setCategory(initialData.category);
                
                const memberIds = Object.keys(initialData.split);
                setSelectedMembers(memberIds);
                prevAmountRef.current = initialData.amount;

                // Initialize split mode based on saved data
                if (initialData.splitMethod) {
                    setSplitMode(initialData.splitMethod);
                    if (initialData.splitMethod === 'percent') {
                        const total = initialData.amount;
                        const newManuals: Record<string, string> = {};
                        memberIds.forEach(id => {
                            const val = (initialData.split[id] as number) || 0;
                            const pct = total > 0 ? (val / total) * 100 : 0;
                            newManuals[id] = pct.toFixed(2);
                        });
                        setManualSplits(newManuals);
                    } else if (initialData.splitMethod === 'unequal') {
                        const newManuals: Record<string, string> = {};
                        memberIds.forEach(id => {
                           newManuals[id] = ((initialData.split[id] as number) || 0).toFixed(2);
                        });
                        setManualSplits(newManuals);
                    }
                } else {
                    // Fallback logic: Check if splits are roughly equal
                    const values = Object.values(initialData.split) as number[];
                    const avg = initialData.amount / values.length;
                    const allEqual = values.length > 0 && values.every(v => Math.abs(v - avg) < 0.1);
                    
                    if (allEqual) {
                        setSplitMode('equal');
                    } else {
                        setSplitMode('unequal');
                        const newManuals: Record<string, string> = {};
                        memberIds.forEach(id => {
                           newManuals[id] = ((initialData.split[id] as number) || 0).toFixed(2);
                        });
                        setManualSplits(newManuals);
                    }
                }
            } else {
                // Default New Expense State
                setTitle('');
                setAmount('');
                setPaidBy('me');
                setCategory(group.categories[0] || 'General');
                setCreateList(false);
                setSplitMode('equal');
                setSelectedMembers(group.members.map((m: any) => m.id)); // Default all members
                setManualSplits({});
                prevAmountRef.current = 0;
            }
        }
    }, [isOpen, initialData, group]);

    // Effect to handle amount updates and auto-recalculation
    useEffect(() => {
        const total = parseFloat(amount) || 0;
        const oldTotal = prevAmountRef.current;
        
        // Only trigger if amount has substantively changed to avoid unnecessary updates
        if (Math.abs(total - oldTotal) > 0.001) {
            if (splitMode === 'equal') {
                if (selectedMembers.length > 0) {
                    const share = total / selectedMembers.length;
                    const newSplits: Record<string, string> = {};
                    selectedMembers.forEach(id => {
                        newSplits[id] = share.toFixed(2);
                    });
                    setManualSplits(newSplits);
                }
            } else if (splitMode === 'unequal') {
                // Auto-scale proportional splits if in unequal mode
                const currentSum = selectedMembers.reduce((sum, id) => sum + (parseFloat(manualSplits[id]) || 0), 0);
                
                if (currentSum > 0) {
                    const ratio = total / currentSum;
                    const newSplits: Record<string, string> = {};
                    selectedMembers.forEach(id => {
                        const val = parseFloat(manualSplits[id]) || 0;
                        newSplits[id] = (val * ratio).toFixed(2);
                    });
                    setManualSplits(newSplits);
                } else if (currentSum === 0 && total > 0 && selectedMembers.length > 0) {
                    // Initialize from 0 -> Distribute equally as starting point
                    const share = total / selectedMembers.length;
                    const newSplits: Record<string, string> = {};
                    selectedMembers.forEach(id => newSplits[id] = share.toFixed(2));
                    setManualSplits(newSplits);
                }
            }
            prevAmountRef.current = total;
        } else {
            // Handle case where amount is unchanged but members/mode changed
             if (splitMode === 'equal') {
                const share = total / (selectedMembers.length || 1);
                 const newSplits: Record<string, string> = {};
                 selectedMembers.forEach(id => newSplits[id] = share.toFixed(2));
                 setManualSplits(newSplits);
            }
        }
    }, [amount, selectedMembers, splitMode]); 

    // Calculate dynamic amount per member based on mode for DISPLAY and SAVE
    const getMemberShare = (memberId: string) => {
        if (!selectedMembers.includes(memberId)) return 0;
        
        const totalAmount = parseFloat(amount) || 0;
        
        if (splitMode === 'equal') {
            return totalAmount / selectedMembers.length;
        } else if (splitMode === 'unequal') {
            return parseFloat(manualSplits[memberId]) || 0;
        } else if (splitMode === 'percent') {
            const pct = parseFloat(manualSplits[memberId]) || 0;
            return totalAmount * (pct / 100);
        }
        return 0;
    };

    // Calculate Sum of Splits
    const getCurrentTotalSplit = () => {
         return selectedMembers.reduce((sum, id) => sum + getMemberShare(id), 0);
    };

    const toggleMemberSelection = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    const handleManualInputChange = (memberId: string, value: string) => {
        setManualSplits({ ...manualSplits, [memberId]: value });
    };

    const handleSetSplitMode = (newMode: 'equal' | 'unequal' | 'percent') => {
        const total = parseFloat(amount) || 0;
        const newSplits: Record<string, string> = {};

        if (newMode === 'equal') {
            // logic handled by useEffect
        } else if (newMode === 'percent') {
             if (splitMode === 'unequal') {
                // Convert current amounts to %
                selectedMembers.forEach(id => {
                    const val = parseFloat(manualSplits[id]) || 0;
                    newSplits[id] = total > 0 ? ((val / total) * 100).toFixed(2) : '0';
                });
             } else {
                // From Equal
                const pct = (100 / selectedMembers.length).toFixed(2);
                selectedMembers.forEach(id => newSplits[id] = pct);
             }
        } else if (newMode === 'unequal') {
             if (splitMode === 'percent') {
                 // Convert % to amounts
                 selectedMembers.forEach(id => {
                     const pct = parseFloat(manualSplits[id]) || 0;
                     newSplits[id] = (total * (pct / 100)).toFixed(2);
                 });
             } else {
                 // From Equal
                 const share = (total / selectedMembers.length).toFixed(2);
                 selectedMembers.forEach(id => newSplits[id] = share);
             }
        }
        
        setManualSplits(newSplits);
        setSplitMode(newMode);
    };

    const redistributeUnequal = () => {
        // Helper to redistribute difference proportionally in Unequal mode manually
        const currentTotal = parseFloat(amount) || 0;
        const currentSplitSum = selectedMembers.reduce((sum, id) => sum + (parseFloat(manualSplits[id]) || 0), 0);
        
        if (currentSplitSum > 0 && currentTotal > 0) {
            const ratio = currentTotal / currentSplitSum;
            const newSplits: Record<string, string> = {};
            selectedMembers.forEach(id => {
                const oldVal = parseFloat(manualSplits[id]) || 0;
                newSplits[id] = (oldVal * ratio).toFixed(2);
            });
            setManualSplits(newSplits);
        }
    };

    if (!isOpen) return null;

    const handleSave = () => {
        const amt = parseFloat(amount) || 0;
        const split: Record<string, number> = {};
        
        // Validate total
        let computedTotal = 0;
        selectedMembers.forEach(mId => {
            const share = getMemberShare(mId);
            split[mId] = share;
            computedTotal += share;
        });

        // Basic validation tolerance for float math
        if (Math.abs(computedTotal - amt) > 1) {
            alert(`Split amounts (${computedTotal.toFixed(2)}) do not match total amount (${amt.toFixed(2)}). Please check your splits.`);
            return;
        }

        const newExpenseId = initialData?.id || generateId();

        if (createList && onCreateShoppingList) {
            onCreateShoppingList(group.name, title || 'Shared Expense', amt, group.members, {
                groupId: group.id,
                groupExpenseId: newExpenseId,
                expenseName: title || 'Shared Expense'
            });
        }

        onConfirm({
            id: newExpenseId,
            title,
            amount: amt,
            paidBy,
            sharedWith: selectedMembers,
            category,
            date: new Date().toISOString().split('T')[0],
            split,
            type: 'expense',
            splitMethod: splitMode // Persist split method
        });
    };

    const currentSplitSum = getCurrentTotalSplit();
    const amtFloat = parseFloat(amount) || 0;
    const isSplitMismatch = Math.abs(currentSplitSum - amtFloat) > 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar text-white">
                
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-white">{initialData ? 'Edit Expense' : 'Add Expense'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                    {/* Title Input */}
                    <div>
                        <input 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                            placeholder="Title (e.g. Groceries)" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                        />
                    </div>

                    {/* Amount Input */}
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">{group.currency}</span>
                        <input 
                            type="number" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 pl-10 text-lg font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                            placeholder="0.00" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                        />
                    </div>

                    {/* Category Select */}
                    <div className="relative">
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500"
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                        >
                            {group.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    {/* Linked Shopping List Toggle */}
                    {!initialData && (
                        <div 
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${createList ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}
                            onClick={() => setCreateList(!createList)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${createList ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    <ShoppingBag size={16} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white">Create Linked Shopping List</div>
                                    <div className="text-[10px] text-slate-400">Add budget & members to Shopping</div>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${createList ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}`}>
                                {createList && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                        </div>
                    )}

                    {/* Paid By Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Paid By</label>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {group.members.map((m: any) => (
                                <button
                                    key={m.id}
                                    onClick={() => setPaidBy(m.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                                        paidBy === m.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded-full ${m.avatarColor} border border-white/20`}></div>
                                    {m.id === 'me' ? 'You' : m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Split Type Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Split Expense</label>
                        <div className="flex bg-slate-800 p-1 rounded-xl">
                            {[
                                { id: 'equal', label: 'Equally' },
                                { id: 'unequal', label: 'Unequally' },
                                { id: 'percent', label: 'By %' }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleSetSplitMode(mode.id as any)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                        splitMode === mode.id 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Member List & Amounts */}
                    <div className="space-y-1.5 bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                        {group.members.map((m: any) => {
                            const isSelected = selectedMembers.includes(m.id);
                            const amountVal = getMemberShare(m.id);
                            
                            return (
                                <div key={m.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Checkbox checked={isSelected} onChange={() => toggleMemberSelection(m.id)} />
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full ${m.avatarColor} flex items-center justify-center text-[8px] text-white font-bold border border-white/10`}>
                                                {m.name.charAt(0)}
                                            </div>
                                            <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                                {m.id === 'me' ? 'You' : m.name}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="w-24">
                                            {splitMode === 'equal' ? (
                                                <div className="text-right text-xs font-bold text-slate-300">
                                                    {group.currency} {amountVal.toFixed(2)}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <div className="relative w-full">
                                                        {splitMode === 'unequal' && <span className="absolute left-2 top-1.5 text-slate-500 text-[9px]">{group.currency}</span>}
                                                        {splitMode === 'percent' && <span className="absolute right-2 top-1.5 text-slate-500 text-[9px]">%</span>}
                                                        <input 
                                                            type="number"
                                                            className={`w-full bg-slate-900 border border-slate-700 rounded-lg py-1 text-[10px] font-bold text-white outline-none focus:border-indigo-500 text-right ${splitMode === 'unequal' ? 'pl-6 pr-2' : 'pr-5 pl-2'}`}
                                                            placeholder="0"
                                                            value={manualSplits[m.id] || ''}
                                                            onChange={(e) => handleManualInputChange(m.id, e.target.value)}
                                                        />
                                                    </div>
                                                    {splitMode === 'percent' && (
                                                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                                            {group.currency} {amountVal.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Validation & Action */}
                    {isSplitMismatch && splitMode === 'unequal' && (
                        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex justify-between items-center">
                             <span className="text-[10px] text-red-400 font-bold">Total Mismatch: {group.currency} {(amtFloat - currentSplitSum).toFixed(2)} left</span>
                             <button onClick={redistributeUnequal} className="text-[9px] font-bold bg-red-500/20 text-red-300 px-2 py-1 rounded hover:bg-red-500/30 transition-colors">
                                 Distribute
                             </button>
                        </div>
                    )}

                    <div className="flex gap-2 mt-2">
                        {initialData && onDelete && (
                            <button onClick={onDelete} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 size={20} /></button>
                        )}
                        <button 
                            onClick={handleSave} 
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-sm tracking-wide"
                        >
                            Confirm Split
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};