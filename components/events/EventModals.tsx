
import React, { useState, useEffect } from 'react';
import { X, Camera, Check, ShoppingBag, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/calculations';

// --- Create/Edit Event Modals ---

export const CreateEventModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [type, setType] = useState('General'); const [budget, setBudget] = useState(''); const [date, setDate] = useState(''); const [location, setLocation] = useState('');
    if(!isOpen) return null;
    const handleSubmit = () => { onConfirm({ id: generateId(), name, type, date, location, totalBudget: parseFloat(budget) || 0, currencySymbol, categories: [{ id: generateId(), name: 'General', allocated: parseFloat(budget)||0, color: '#6366f1' }], expenses: [], vendors: [], members: [{ id: 'me', name: 'You', role: 'admin' }], notes: '', created: Date.now(), theme: 'colorful' }); };
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Plan New Event</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Event Name" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Budget" value={budget} onChange={e => setBudget(e.target.value)} /><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={date} onChange={e => setDate(e.target.value)} /><button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Start Planning</button></div></div></div>);
};

export const EditEventModal = ({ isOpen, onClose, onConfirm, initialData, currencySymbol }: any) => {
    const [name, setName] = useState(initialData.name); const [budget, setBudget] = useState(initialData.totalBudget.toString()); const [date, setDate] = useState(initialData.date);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Event</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={budget} onChange={e => setBudget(e.target.value)} /><button onClick={() => onConfirm({ name, totalBudget: parseFloat(budget) || 0, date })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save Changes</button></div></div></div>);
};

// --- Budget/Expense Modals ---

export const AddEventExpenseModal = ({ isOpen, onClose, onConfirm, categories, currencySymbol, event, onCreateShoppingList }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]?.name || '');
    const [paidBy, setPaidBy] = useState('me');
    const [shouldCreateList, setShouldCreateList] = useState(false); 

    useEffect(() => {
        if(isOpen) {
            setName('');
            setAmount('');
            setCategory(categories[0]?.name || '');
            setPaidBy('me');
            setShouldCreateList(false); 
        }
    }, [isOpen, categories]);

    if(!isOpen) return null;

    const handleSave = () => {
        const newExpenseId = generateId(); 
        
        if (shouldCreateList && onCreateShoppingList && event) {
             const listName = `${event.name} - ${name || 'Expense'}`;
             onCreateShoppingList(listName, parseFloat(amount) || 0, event.members, {
                 eventId: event.id,
                 expenseId: newExpenseId,
                 expenseName: name || 'Expense'
             });
        }
        
        onConfirm({ id: newExpenseId, name, amount: parseFloat(amount), category, paidBy });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Expense</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <button className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 text-xs font-bold flex items-center justify-center gap-2 mb-2">
                        <Camera size={16} /> Scan Receipt (Simulated)
                    </button>
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Description" value={name} onChange={e => setName(e.target.value)} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-xs" value={category} onChange={e => setCategory(e.target.value)}>
                            {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-xs" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                            <option value="me">Paid by Me</option>
                            {event.members.filter((m:any) => m.id !== 'me').map((m: any) => (
                                <option key={m.id} value={m.id}>Paid by {m.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div 
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${shouldCreateList ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                        onClick={() => setShouldCreateList(!shouldCreateList)}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${shouldCreateList ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                            {shouldCreateList && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1">
                            <div className={`text-xs font-bold ${shouldCreateList ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>Create Linked Shopping List</div>
                            <div className="text-[10px] text-slate-400">Add budget & members to Shopping</div>
                        </div>
                        <ShoppingBag size={18} className={shouldCreateList ? 'text-emerald-500' : 'text-slate-400'} />
                    </div>

                    <button onClick={handleSave} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save</button>
                </div>
            </div>
        </div>
    );
};

export const AddCategoryModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [allocated, setAllocated] = useState('');
    if(!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Category</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Name" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Amount" value={allocated} onChange={e => setAllocated(e.target.value)} /><button onClick={() => onConfirm({ name, allocated: parseFloat(allocated) || 0 })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Create</button></div></div></div>);
};

export const EditCategoryModal = ({ isOpen, onClose, onConfirm, category, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [allocated, setAllocated] = useState('');
    useEffect(() => { if (isOpen && category) { setName(category.name); setAllocated(category.allocated.toString()); } }, [isOpen, category]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Category</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={allocated} onChange={e => setAllocated(e.target.value)} /><button onClick={() => onConfirm({ ...category, name, allocated: parseFloat(allocated) || 0 })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Update</button></div></div></div>);
};

export const EditExpenseModal = ({ isOpen, onClose, onConfirm, onDelete, expense, categories, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [category, setCategory] = useState('');
    useEffect(() => { if (isOpen && expense) { setName(expense.name); setAmount(expense.amount.toString()); setCategory(expense.category); } }, [isOpen, expense]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Expense</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={amount} onChange={e => setAmount(e.target.value)} /><select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={category} onChange={e => setCategory(e.target.value)}>{categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select><div className="flex gap-2 mt-2"><button onClick={() => onDelete(expense.id)} className="flex-1 py-3 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20"><Trash2 size={16}/> Delete</button><button onClick={() => onConfirm({ ...expense, name, amount: parseFloat(amount) || 0, category })} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Update</button></div></div></div></div>);
};

// --- Vendor Modals ---

export const AddVendorModal = ({ isOpen, onClose, onConfirm, currencySymbol, categories }: any) => {
    const [name, setName] = useState(''); const [service, setService] = useState(''); const [total, setTotal] = useState(''); const [advance, setAdvance] = useState(''); const [dueDate, setDueDate] = useState('');
    useEffect(() => { if(isOpen) { setName(''); setService(categories[0]?.name||''); setTotal(''); setAdvance(''); setDueDate(''); } }, [isOpen, categories]);
    if(!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Vendor</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Vendor Name" value={name} onChange={e => setName(e.target.value)} /><select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={service} onChange={e => setService(e.target.value)}>{categories?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Total Cost" value={total} onChange={e => setTotal(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Advance" value={advance} onChange={e => setAdvance(e.target.value)} /><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} /><button onClick={() => onConfirm({ name, service, totalAmount: parseFloat(total), advance: parseFloat(advance), dueDate })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Add</button></div></div></div>);
};

export const EditVendorModal = ({ isOpen, onClose, onConfirm, onDelete, vendor, currencySymbol, categories }: any) => {
    const [name, setName] = useState(''); const [service, setService] = useState(''); const [total, setTotal] = useState(''); const [dueDate, setDueDate] = useState('');
    useEffect(() => { if (isOpen && vendor) { setName(vendor.name); setService(vendor.service); setTotal(vendor.totalAmount.toString()); setDueDate(vendor.dueDate || ''); } }, [isOpen, vendor]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Vendor</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={service} onChange={e => setService(e.target.value)}>{categories?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={total} onChange={e => setTotal(e.target.value)} /><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} /><div className="flex gap-2 mt-2"><button onClick={() => onDelete(vendor.id)} className="flex-1 py-3 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20"><Trash2 size={16}/> Delete</button><button onClick={() => onConfirm({ ...vendor, name, service, totalAmount: parseFloat(total) || 0, dueDate })} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Update</button></div></div></div></div>);
};

// --- Team Modals ---

export const EditEventMemberModal = ({ isOpen, onClose, onConfirm, member }: any) => {
    const [role, setRole] = useState(member?.role || 'viewer');
    
    useEffect(() => {
        if (member) setRole(member.role);
    }, [member]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Member</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Name</label>
                        <div className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300">
                            {member.name}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Role</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold"
                        >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">Cancel</button>
                        <button onClick={() => onConfirm(member.id, role)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
