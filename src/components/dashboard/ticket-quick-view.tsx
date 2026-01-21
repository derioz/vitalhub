'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
    X, ExternalLink, User, Clock, Tag, AlertTriangle,
    MessageSquare, UserPlus, ArrowUpCircle, XCircle, CheckCircle2,
    Loader2, Send, Hash
} from 'lucide-react';
import { Ticket, TicketMessage } from '@/types/ticket';
import { TicketService } from '@/services/ticket-service';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { getCategoryConfig } from '@/lib/ticket-categories';

interface TicketQuickViewProps {
    ticketId: string;
    onClose: () => void;
}

export default function TicketQuickView({ ticketId, onClose }: TicketQuickViewProps) {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [quickReply, setQuickReply] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const loadTicket = async () => {
            setLoading(true);
            try {
                // Fetch ticket
                const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
                if (ticketDoc.exists()) {
                    setTicket({ id: ticketDoc.id, ...ticketDoc.data() } as Ticket);
                }

                // Fetch recent messages
                const messagesRef = collection(db, 'tickets', ticketId, 'messages');
                const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(5));
                const messagesSnap = await getDocs(messagesQuery);
                setMessages(messagesSnap.docs.map(d => ({ id: d.id, ...d.data() } as TicketMessage)).reverse());
            } catch (err) {
                console.error('Failed to load ticket:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTicket();
    }, [ticketId]);

    const handleAssign = async () => {
        if (!user || !userData || !ticket) return;
        setActionLoading(true);
        try {
            await TicketService.assignTicket(ticket.id, user.uid, userData.name || 'Staff');
            setTicket(prev => prev ? { ...prev, assignedTo: user.uid, assignedToName: userData.name || 'Staff', status: 'IN_PROGRESS' } : null);
        } catch (err) {
            console.error('Failed to assign:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEscalate = async () => {
        if (!ticket) return;
        setActionLoading(true);
        try {
            await TicketService.escalateTicket(ticket.id, 'URGENT');
            setTicket(prev => prev ? { ...prev, priority: 'URGENT' } : null);
        } catch (err) {
            console.error('Failed to escalate:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleClose = async () => {
        if (!ticket) return;
        setActionLoading(true);
        try {
            await TicketService.updateStatus(ticket.id, 'CLOSED');
            setTicket(prev => prev ? { ...prev, status: 'CLOSED' } : null);
        } catch (err) {
            console.error('Failed to close:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickReply = async () => {
        if (!quickReply.trim() || !user || !userData || !ticket) return;
        setSending(true);
        try {
            await TicketService.addMessage(
                ticket.id,
                user.uid,
                userData.name || 'Staff',
                quickReply,
                false
            );
            setQuickReply('');
            // Refresh messages
            const messagesRef = collection(db, 'tickets', ticketId, 'messages');
            const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(5));
            const messagesSnap = await getDocs(messagesQuery);
            setMessages(messagesSnap.docs.map(d => ({ id: d.id, ...d.data() } as TicketMessage)).reverse());
        } catch (err) {
            console.error('Failed to send reply:', err);
        } finally {
            setSending(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'text-red-500 bg-red-500/10 border-red-500/30';
            case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
            case 'NORMAL': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
            case 'LOW': return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'text-green-500 bg-green-500/10';
            case 'IN_PROGRESS': return 'text-blue-500 bg-blue-500/10';
            case 'WAITING_ON_USER': return 'text-yellow-500 bg-yellow-500/10';
            case 'CLOSED':
            case 'RESOLVED': return 'text-gray-500 bg-gray-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
                    </div>
                ) : !ticket ? (
                    <div className="p-12 text-center">
                        <p className="text-[#8b949e]">Ticket not found</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-[#21262d] bg-[#161b22] shrink-0">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="flex items-center gap-1 text-xs font-mono text-[#8b949e]">
                                            <Hash className="h-3 w-3" />
                                            {ticket.ticketId}
                                        </span>
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium uppercase", getStatusColor(ticket.status))}>
                                            {ticket.status?.replace('_', ' ')}
                                        </span>
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium uppercase border", getPriorityColor(ticket.priority || 'NORMAL'))}>
                                            {ticket.priority === 'URGENT' && <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />}
                                            {ticket.priority || 'NORMAL'}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-white truncate">{ticket.subject}</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-4 mt-3 text-xs text-[#484f58] flex-wrap">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {ticket.authorName || ticket.authorEmail || 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {(() => {
                                        const catConfig = getCategoryConfig(ticket.category);
                                        return <span className={catConfig.color}>{catConfig.emoji} {catConfig.label}</span>;
                                    })()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(
                                        ticket.createdAt?.toDate?.() || new Date(ticket.createdAt as any),
                                        { addSuffix: true }
                                    )}
                                </span>
                                {ticket.assignedToName && (
                                    <span className="flex items-center gap-1 text-blue-400">
                                        <UserPlus className="h-3 w-3" />
                                        {ticket.assignedToName}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="p-3 border-b border-[#21262d] flex items-center gap-2 flex-wrap bg-[#0d1117]">
                            <button
                                onClick={handleAssign}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1.5"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Assign to Me
                            </button>
                            <button
                                onClick={handleEscalate}
                                disabled={actionLoading || ticket.priority === 'URGENT'}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <ArrowUpCircle className="h-3.5 w-3.5" />
                                Escalate
                            </button>
                            <button
                                onClick={handleClose}
                                disabled={actionLoading || ticket.status === 'CLOSED'}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Close
                            </button>
                            <button
                                onClick={() => { onClose(); router.push(`/dashboard/tickets/${ticket.id}`); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors flex items-center gap-1.5 ml-auto"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open Full
                            </button>
                        </div>

                        {/* Description */}
                        <div className="p-4 border-b border-[#21262d]">
                            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Description</h3>
                            <p className="text-sm text-[#e6edf3] whitespace-pre-wrap leading-relaxed line-clamp-4">
                                {ticket.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Recent Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Recent Messages
                                <span className="text-[10px] font-normal bg-[#21262d] px-2 py-0.5 rounded-full">
                                    {messages.length}
                                </span>
                            </h3>
                            {messages.length === 0 ? (
                                <p className="text-sm text-[#484f58] italic">No messages yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="p-3 rounded-lg bg-[#161b22] border border-[#21262d]">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center text-[8px] font-bold text-white">
                                                    {msg.authorName?.charAt(0).toUpperCase() || 'S'}
                                                </div>
                                                <span className="text-xs font-medium text-white">{msg.authorName}</span>
                                                <span className="text-[10px] text-[#484f58]">
                                                    {msg.createdAt?.toDate
                                                        ? format(msg.createdAt.toDate(), 'MMM d, h:mm a')
                                                        : 'Just now'}
                                                </span>
                                                {msg.isInternal && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 uppercase">Internal</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[#e6edf3] line-clamp-3">{msg.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Reply */}
                        <div className="p-4 border-t border-[#21262d] bg-[#161b22] shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={quickReply}
                                    onChange={(e) => setQuickReply(e.target.value)}
                                    placeholder="Quick reply..."
                                    className="flex-1 px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6]"
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickReply(); } }}
                                />
                                <button
                                    onClick={handleQuickReply}
                                    disabled={!quickReply.trim() || sending}
                                    className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-medium text-sm hover:bg-[#2563eb] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                >
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
