import React, { useState } from 'react';

interface AddGroupCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export const AddGroupCategoryModal: React.FC<AddGroupCategoryModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Category</h3>
                <div className="space-y-3">
                    <input 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-900 dark:text-white" 
                        placeholder="Category Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        autoFocus 
                    />
                    <button 
                        onClick={() => { if(name) onConfirm(name); setName(''); }} 
                        disabled={!name}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2 disabled:opacity-50"
                    >
                        Add Category
                    </button>
                </div>
            </div>
        </div>
    );
};