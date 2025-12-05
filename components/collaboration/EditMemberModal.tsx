import React, { useState, useEffect } from 'react';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (memberId: string, role: string) => void;
  member: any;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, onConfirm, member }) => {
    const [role, setRole] = useState(member?.role || 'Viewer');
    
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
                            <option value="Owner">Owner</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
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