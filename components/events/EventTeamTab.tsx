
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { formatCurrency, generateId } from '../../utils/calculations';
import { EventData, EventMember } from '../../types';
import { Pencil, Trash2 } from 'lucide-react';
import { EditEventMemberModal } from './EventModals';
import { EventSettlementTab } from './EventSettlementTab';

interface EventTeamTabProps {
  event: EventData;
  onUpdate: (e: EventData) => void;
  currencySymbol: string;
}

export const EventTeamTab: React.FC<EventTeamTabProps> = ({ event, onUpdate, currencySymbol }) => {
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [editingMember, setEditingMember] = useState<EventMember | null>(null);
    
    const handleAddMember = () => {
        if (!newMemberEmail) return;
        const newMember: EventMember = {
            id: generateId(),
            name: newMemberEmail.split('@')[0],
            role: 'viewer',
            avatar: undefined // Using default logic in avatar rendering
        };
        onUpdate({ ...event, members: [...event.members, newMember] });
        setNewMemberEmail('');
    };

    const handleRemoveMember = (id: string) => {
        if (confirm('Remove this member?')) {
            onUpdate({ ...event, members: event.members.filter((m: any) => m.id !== id) });
        }
    };

    const handleUpdateMemberRole = (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
        const updatedMembers = event.members.map((m: any) => 
            m.id === memberId ? { ...m, role: newRole } : m
        );
        onUpdate({ ...event, members: updatedMembers });
        setEditingMember(null);
    };

    const getMemberContribution = (memberId: string) => {
        return event.expenses
            .filter((e: any) => (e.paidBy === memberId) || (memberId === 'me' && !e.paidBy)) // Handle default 'me'
            .reduce((sum: number, e: any) => sum + e.amount, 0);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Team Members</h3>
                <div className="space-y-3">
                    {event.members.map((member: any) => {
                        const paidAmount = getMemberContribution(member.id);
                        
                        return (
                            <div key={member.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300`}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 capitalize">{member.role}</span>
                                            {paidAmount > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                                                    Paid: {formatCurrency(paidAmount, currencySymbol)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setEditingMember(member)}
                                        className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    {member.id !== 'me' && (
                                        <button 
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                            placeholder="Email address"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                        <button onClick={handleAddMember} disabled={!newMemberEmail} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">
                            Invite
                        </button>
                    </div>
                </div>
            </Card>

            <EditEventMemberModal 
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                onConfirm={handleUpdateMemberRole}
                member={editingMember}
            />

            {/* Added Settlement Section within Team Tab */}
            <div className="my-6 border-t border-slate-200 dark:border-slate-700"></div>
            
            <EventSettlementTab event={event} currencySymbol={currencySymbol} onUpdate={onUpdate} />
        </div>
    );
};
