import React, { useState, useEffect } from 'react';
import { generateId } from '../../utils/calculations';
import { SharedGroup } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (group: SharedGroup) => void;
  initialData?: SharedGroup;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onConfirm, initialData }) => {
    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');
    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setBudget(initialData.totalBudget.toString());
            setCurrency(initialData.currency);
        } else if (isOpen) {
            setName('');
            setBudget('');
            setCurrency('USD');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{initialData ? 'Edit Group' : 'Create Group'}</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white" placeholder="Group Name" value={name} onChange={e => setName(e.target.value)} />
                    <div className="flex gap-2">
                        <select className="w-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white" value={currency} onChange={e => setCurrency(e.target.value)}>
                            {['USD', 'EUR', 'GBP', 'LKR', 'INR'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white" placeholder="Total Budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                    <button 
                        onClick={() => onConfirm(initialData ? { ...initialData, name, totalBudget: parseFloat(budget) || 0, currency } : { id: generateId(), name, totalBudget: parseFloat(budget) || 0, currency, members: [{id:'me', name:'You', role:'Owner', avatarColor:'bg-indigo-500'}], expenses: [], activityLog: [], categories: ['General'], settings: {shareAllCategories: true} })}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2 hover:bg-indigo-700 transition-colors"
                    >
                        {initialData ? 'Save Changes' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};