'use client';

import { useAuth } from '@/components/auth-provider';
import { TicketService } from '@/services/ticket-service';
import { Ticket } from '@/types/ticket';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Clock, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { NewTicketModal } from '@/components/tickets/new-ticket-modal';

export default function TicketsPage() {
    const { user, userData } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    const loadTickets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await TicketService.getMemberTickets(user.uid);
            setTickets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'IN_PROGRESS': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'WAITING_ON_USER': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'CLOSED':
            case 'RESOLVED': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0d1117] font-sans text-slate-200">
            {/* Nav */}
            <nav className="sticky top-0 z-40 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d] px-6 py-4">
                <div className="max-w-[1400px] mx-auto flex items-center gap-4">
                    <Link href="/" className="p-2 -ml-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-white">My Support Tickets</h1>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-[#8b949e]">
                        View and manage your support requests.
                    </p>
                    <button
                        onClick={() => setIsTicketModalOpen(true)}
                        className="px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold rounded-lg shadow-lg shadow-orange-900/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Ticket
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
                    </div>
                ) : tickets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {tickets.map(ticket => (
                            <Link
                                key={ticket.id}
                                href={`/tickets/${ticket.id}`}
                                className="group p-6 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#f97316]/50 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="h-12 w-12 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center font-mono text-sm font-bold text-[#8b949e] group-hover:text-[#f97316] transition-colors">
                                        #{ticket.ticketId}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-[#f97316] transition-colors">
                                            {ticket.subject}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-[#8b949e]">
                                            <span className={cn("px-2 py-0.5 rounded border uppercase tracking-wider", getStatusColor(ticket.status))}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(ticket.createdAt.seconds * 1000), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-[#30363d] group-hover:text-[#8b949e] transition-colors" />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-[#30363d] bg-[#161b22]/50">
                        <div className="h-16 w-16 rounded-full bg-[#21262d] flex items-center justify-center mb-6">
                            <MessageSquare className="h-8 w-8 text-[#8b949e]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No tickets found</h3>
                        <p className="text-[#8b949e] max-w-sm mb-6">
                            You haven't created any support tickets yet. Need help with something?
                        </p>
                        <button
                            onClick={() => setIsTicketModalOpen(true)}
                            className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] text-white font-bold rounded-xl border border-[#30363d] transition-colors"
                        >
                            Create Support Ticket
                        </button>
                    </div>
                )}
            </main>

            <NewTicketModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                onSuccess={loadTickets}
            />
        </div>
    );
}
