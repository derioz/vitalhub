'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TicketService } from '@/services/ticket-service';
import { Ticket } from '@/types/ticket';
import { useAuth } from '@/components/auth-provider';
import {
    Ticket as TicketIcon,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Users,
    TrendingUp,
    ChevronRight,
    Filter,
    Search,
    MoreHorizontal,
    UserPlus,
    XCircle,
    ArrowUpCircle,
    Loader2,
    Plus,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import TicketQuickView from './ticket-quick-view';
import { NewTicketModal } from '@/components/tickets/new-ticket-modal';
import { getCategoryConfig, getCategoryOptions } from '@/lib/ticket-categories';

interface TicketStats {
    total: number;
    open: number;
    inProgress: number;
    pending: number;
    closed: number;
    byPriority: { URGENT: number; HIGH: number; NORMAL: number; LOW: number };
    byCategory: Record<string, number>;
    avgResolutionHours: number;
    resolvedToday: number;
    createdToday: number;
}

interface TicketCommandCenterProps {
    className?: string;
}

export default function TicketCommandCenter({ className }: TicketCommandCenterProps) {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);

    // Load stats and tickets
    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedStats, fetchedTickets] = await Promise.all([
                TicketService.getTicketStats(),
                TicketService.getTickets()
            ]);
            setStats(fetchedStats);
            setTickets(fetchedTickets);
        } catch (err) {
            console.error('Failed to load ticket data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Real-time subscription
        const unsubscribe = TicketService.subscribeToTickets((updatedTickets) => {
            setTickets(updatedTickets);
        });

        return () => unsubscribe();
    }, []);

    // Filter tickets
    const filteredTickets = tickets.filter((ticket) => {
        if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false;
        if (categoryFilter !== 'ALL' && ticket.category !== categoryFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                ticket.subject.toLowerCase().includes(query) ||
                ticket.ticketId?.toString().includes(query) ||
                ticket.authorEmail?.toLowerCase().includes(query) ||
                ticket.authorName?.toLowerCase().includes(query)
            );
        }
        return true;
    }).slice(0, 10); // Limit to 10 for queue view

    const categoryOptions = getCategoryOptions();

    // Toggle ticket selection
    const toggleSelect = (ticketId: string) => {
        const newSelected = new Set(selectedTickets);
        if (newSelected.has(ticketId)) {
            newSelected.delete(ticketId);
        } else {
            newSelected.add(ticketId);
        }
        setSelectedTickets(newSelected);
        setShowBulkActions(newSelected.size > 0);
    };

    // Bulk actions
    const handleBulkClose = async () => {
        await TicketService.bulkUpdateStatus(Array.from(selectedTickets), 'CLOSED');
        setSelectedTickets(new Set());
        setShowBulkActions(false);
        loadData();
    };

    const handleBulkAssignToMe = async () => {
        if (!user || !userData) return;
        await TicketService.bulkAssign(
            Array.from(selectedTickets),
            user.uid,
            userData.name || 'Staff'
        );
        setSelectedTickets(new Set());
        setShowBulkActions(false);
        loadData();
    };

    // Quick actions
    const handleQuickClose = async (ticketId: string) => {
        await TicketService.updateStatus(ticketId, 'CLOSED');
        loadData();
    };

    const handleQuickAssign = async (ticketId: string) => {
        if (!user || !userData) return;
        await TicketService.assignTicket(ticketId, user.uid, userData.name || 'Staff');
        loadData();
    };

    const handleEscalate = async (ticketId: string) => {
        await TicketService.escalateTicket(ticketId, 'URGENT');
        loadData();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'text-red-500 bg-red-500/10';
            case 'HIGH': return 'text-orange-500 bg-orange-500/10';
            case 'NORMAL': return 'text-blue-500 bg-blue-500/10';
            case 'LOW': return 'text-gray-500 bg-gray-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
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
        <div className={cn("bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden", className)}>
            {/* Header */}
            <div className="p-4 border-b border-[#21262d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TicketIcon className="h-5 w-5 text-[#f97316]" />
                    <h2 className="text-lg font-semibold text-white">Ticket Command Center</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNewTicketModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f9a825] via-[#f97316] to-[#ea580c] text-white text-xs font-medium flex items-center gap-1.5 hover:brightness-110 transition-all shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New Ticket
                    </button>
                    <button
                        onClick={loadData}
                        className="p-2 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-px bg-[#21262d]">
                <div className="bg-[#161b22] p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <TicketIcon className="h-4 w-4 text-[#f97316]" />
                        <span className="text-2xl font-bold text-white">{stats?.open ?? '-'}</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Open</p>
                </div>
                <div className="bg-[#161b22] p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                        <span className="text-2xl font-bold text-white">{stats?.byPriority.URGENT ?? '-'}</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Urgent</p>
                </div>
                <div className="bg-[#161b22] p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Clock className="h-4 w-4 text-[#fbbf24]" />
                        <span className="text-2xl font-bold text-white">{stats?.pending ?? '-'}</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Pending</p>
                </div>
                <div className="bg-[#161b22] p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <TrendingUp className="h-4 w-4 text-[#f97316]" />
                        <span className="text-2xl font-bold text-white">{stats?.avgResolutionHours ?? '-'}h</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Avg Resolve</p>
                </div>
                <div className="bg-[#161b22] p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                        <span className="text-2xl font-bold text-white">{stats?.resolvedToday ?? '-'}</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Resolved Today</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="p-3 border-b border-[#21262d] flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <Search className="h-4 w-4 text-[#8b949e]" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-[#484f58] focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-[#8b949e]" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_ON_USER">Pending</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                        <option value="ALL">All Priority</option>
                        <option value="URGENT">🔴 Urgent</option>
                        <option value="HIGH">🟠 High</option>
                        <option value="NORMAL">🔵 Normal</option>
                        <option value="LOW">🟢 Low</option>
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                        <option value="ALL">All Categories</option>
                        {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {showBulkActions && (
                <div className="p-3 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">{selectedTickets.size} selected</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkAssignToMe}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1"
                        >
                            <UserPlus className="h-3 w-3" />
                            Assign to Me
                        </button>
                        <button
                            onClick={handleBulkClose}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                        >
                            <XCircle className="h-3 w-3" />
                            Close All
                        </button>
                    </div>
                </div>
            )}

            {/* Ticket Queue */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#3b82f6]" />
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-8 text-center">
                        <TicketIcon className="h-8 w-8 text-[#484f58] mx-auto mb-2" />
                        <p className="text-sm text-[#8b949e]">No tickets found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#21262d]">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="p-3 hover:bg-[#0d1117] transition-colors group"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedTickets.has(ticket.id)}
                                        onChange={() => toggleSelect(ticket.id)}
                                        className="mt-1 rounded border-[#30363d] bg-[#0d1117] text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                    />

                                    {/* Ticket Info */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => setPreviewTicketId(ticket.id)}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-[#8b949e]">#{ticket.ticketId}</span>
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium uppercase", getPriorityColor(ticket.priority || 'NORMAL'))}>
                                                {ticket.priority || 'NORMAL'}
                                            </span>
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", getStatusColor(ticket.status))}>
                                                {ticket.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white font-medium truncate">{ticket.subject}</p>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-[#484f58]">
                                            {(() => {
                                                const catConfig = getCategoryConfig(ticket.category);
                                                return <span className={catConfig.color}>{catConfig.emoji} {catConfig.label}</span>;
                                            })()}
                                            <span>•</span>
                                            <span>{formatDistanceToNow(
                                                ticket.createdAt?.toDate?.() || new Date(ticket.createdAt as any),
                                                { addSuffix: true }
                                            )}</span>
                                            <span>•</span>
                                            <span className="text-[#8b949e]">by {ticket.authorName || ticket.authorEmail?.split('@')[0]}</span>
                                            {ticket.assignedToName && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-blue-400">→ {ticket.assignedToName}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleQuickAssign(ticket.id)}
                                            title="Assign to me"
                                            className="p-1.5 rounded text-[#8b949e] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                        >
                                            <UserPlus className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleEscalate(ticket.id)}
                                            title="Escalate to Urgent"
                                            className="p-1.5 rounded text-[#8b949e] hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                                        >
                                            <ArrowUpCircle className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleQuickClose(ticket.id)}
                                            title="Close ticket"
                                            className="p-1.5 rounded text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                                            title="Open ticket"
                                            className="p-1.5 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#21262d] flex items-center justify-between">
                <span className="text-xs text-[#484f58]">
                    Showing {filteredTickets.length} of {tickets.length} tickets
                </span>
                <button
                    onClick={() => router.push('/dashboard/tickets')}
                    className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center gap-1"
                >
                    View All Tickets
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Quick View Modal */}
            {previewTicketId && (
                <TicketQuickView
                    ticketId={previewTicketId}
                    onClose={() => setPreviewTicketId(null)}
                />
            )}

            {/* New Ticket Modal */}
            <NewTicketModal
                isOpen={showNewTicketModal}
                onClose={() => setShowNewTicketModal(false)}
                onSuccess={() => loadData()}
            />
        </div>
    );
}
