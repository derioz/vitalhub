'use client';

import { useEffect, useState } from 'react';
import { TicketService } from '@/services/ticket-service';
import { Ticket } from '@/types/ticket';
import { cn } from '@/lib/utils';
import { getCategoryConfig } from '@/lib/ticket-categories';

interface Props {
    refreshTrigger: number;
}

export function TicketList({ refreshTrigger }: Props) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTickets();
    }, [refreshTrigger]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const data = await TicketService.getTickets();
            setTickets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statusColors: Record<string, string> = {
        'OPEN': 'bg-green-500/10 text-green-400 border-green-500/20',
        'IN_PROGRESS': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'WAITING_ON_USER': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        'RESOLVED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'CLOSED': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    if (loading) return <div className="text-slate-500 p-4">Loading tickets...</div>;

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Author</th>
                        <th className="px-6 py-4">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {tickets.map((t) => {
                        const categoryConfig = getCategoryConfig(t.category);
                        return (
                            <tr
                                key={t.id}
                                onClick={() => window.location.href = `/dashboard/tickets/${t.id}`}
                                className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4 font-mono text-slate-500">#{t.ticketId}</td>
                                <td className="px-6 py-4 font-medium text-white">{t.subject}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-xs border font-medium",
                                        categoryConfig.bgColor,
                                        categoryConfig.color,
                                        categoryConfig.borderColor
                                    )}>
                                        {categoryConfig.emoji} {categoryConfig.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-1 rounded-full text-xs border font-medium", statusColors[t.status])}>
                                        {t.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                    {t.authorName || t.authorEmail?.split('@')[0] || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                </td>
                            </tr>
                        );
                    })}
                    {tickets.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                No tickets found. Good job!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

