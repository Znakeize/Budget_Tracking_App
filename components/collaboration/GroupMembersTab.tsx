import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Pencil, Trash2 } from 'lucide-react';
import { SharedGroup } from '../../types';
import { generateId } from '../../utils/calculations';
import { EditMemberModal } from './EditMemberModal';

interface GroupMembersTabProps {
  group: SharedGroup;
  onUpdate: (g: SharedGroup) => void;
}

export const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ group, onUpdate }) => {
    const [email, setEmail] = useState('');
    const [editingMember, setEditingMember] = useState<any>(null);

    const handleInvite = () => {
        if (!email) return;
        const newMember = { id: generateId(), name: email.split('@')[0], email, role: 'Viewer', avatarColor: 'bg-slate-500' };
        onUpdate({ ...group, members: [...group.members, newMember] });
        setEmail('');
    };

    const handleRemoveMember = (id: string) => {
        if(confirm('Are you sure you want to remove this member?')) {
            onUpdate({ ...group, members: group.members.filter((m: any) => m.id !== id) });
        }
    };

    const handleUpdateMemberRole = (memberId: string, newRole: string) => {
        const updatedMembers = group.members.map((m: any) => 
            m.id === memberId ? { ...m, role: newRole } : m
        );
        onUpdate({ ...group, members: updatedMembers });
        setEditingMember(null);
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="space-y-2">
                {group.members.map((m: any) => (
                    <Card key={m.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${m.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>{m.name.charAt(0)}</div>
                            <div>
                                <div className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</div>
                                <div className="text-[10px] text-slate-500">{m.role}</div>
                            </div>
                        </div>
                        {m.id !== 'me' && (
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setEditingMember(m)}
                                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => handleRemoveMember(m.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
            <div className="flex gap-2">
                <input className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" placeholder="Email to invite" value={email} onChange={e => setEmail(e.target.value)} />
                <button onClick={handleInvite} className="px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm">Invite</button>
            </div>

            <EditMemberModal 
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                member={editingMember}
                onConfirm={handleUpdateMemberRole}
            />
        </div>
    );
};