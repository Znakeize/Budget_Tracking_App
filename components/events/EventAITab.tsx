
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { analyzeEventWithAI } from '../../utils/aiHelper';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { EventData } from '../../types';

interface EventAITabProps {
  event: EventData;
}

export const EventAITab: React.FC<EventAITabProps> = ({ event }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAskAI = async () => {
        if (!query) return;
        setLoading(true);
        const res = await analyzeEventWithAI(event, query);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={20} className="text-yellow-300" />
                    <h3 className="font-bold">Event AI Planner</h3>
                </div>
                <p className="text-xs text-indigo-100 opacity-90">
                    Ask for budget advice, vendor suggestions, or schedule planning.
                </p>
            </Card>

            <Card className="p-4">
                <div className="space-y-3">
                    <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none resize-none h-24"
                        placeholder="e.g. How can I reduce catering costs?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button 
                        onClick={handleAskAI} 
                        disabled={loading || !query}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Ask AI
                    </button>
                </div>
            </Card>

            {response && (
                <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20">
                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2">AI Suggestion</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{response}</p>
                </Card>
            )}
        </div>
    );
};
