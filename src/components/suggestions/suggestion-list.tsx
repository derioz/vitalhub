'use client';

import { useEffect, useState } from 'react';
import { SuggestionService } from '@/services/suggestion-service';
import { Suggestion } from '@/types/suggestion';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { ThumbsUp, CheckCircle, XCircle, Clock, Check } from 'lucide-react';

interface Props {
    refreshTrigger: number;
}

export function SuggestionList({ refreshTrigger }: Props) {
    const { user, userData } = useAuth();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);

    // Naive RBAC
    const isAdmin = userData?.roles?.some((r: string) => ['role_owner', 'role_head_admin', 'role_admin'].includes(r));

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await SuggestionService.getAll();
            setSuggestions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (id: string) => {
        if (!user) return;
        try {
            await SuggestionService.toggleVote(id, user.uid);
            // Optimistic update or refresh
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatus = async (id: string, status: any) => {
        if (!confirm(`Mark as ${status}?`)) return;
        await SuggestionService.updateStatus(id, status);
        loadData();
    };

    if (loading) return <div className="text-slate-500 p-4">Loading ideas...</div>;

    return (
        <div className="grid gap-4">
            {suggestions.map((item) => {
                const hasVoted = user ? item.upvotes.includes(user.uid) : false;

                return (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex gap-4">
                        {/* Vote Column */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => handleVote(item.id)}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    hasVoted
                                        ? "bg-brand-start/20 text-brand-start"
                                        : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                                )}
                            >
                                <ThumbsUp className={cn("h-5 w-5", hasVoted && "fill-current")} />
                            </button>
                            <span className="font-bold text-slate-200">{item.upvotes.length}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-white text-lg">{item.title}</h3>
                                    <p className="text-sm text-slate-500">
                                        by {item.authorName} • {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </p>
                                </div>
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                                    item.status === 'APPROVED' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                        item.status === 'DENIED' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                            item.status === 'IMPLEMENTED' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                )}>
                                    {item.status}
                                </div>
                            </div>

                            <p className="text-slate-300 whitespace-pre-wrap">{item.description}</p>

                            {/* Admin Actions */}
                            {isAdmin && (
                                <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-800/50">
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Admin:</span>
                                    <button onClick={() => handleStatus(item.id, 'APPROVED')} className="p-1 text-green-500 hover:bg-green-900/20 rounded" title="Approve">
                                        <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleStatus(item.id, 'DENIED')} className="p-1 text-red-500 hover:bg-red-900/20 rounded" title="Deny">
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleStatus(item.id, 'IMPLEMENTED')} className="p-1 text-blue-500 hover:bg-blue-900/20 rounded" title="Implemented">
                                        <Check className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {suggestions.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No suggestions yet. Be the first!
                </div>
            )}
        </div>
    );
}
