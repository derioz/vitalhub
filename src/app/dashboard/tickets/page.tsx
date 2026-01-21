'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { TicketService } from '@/services/ticket-service';
import { Ticket } from '@/types/ticket';
import { TicketFiltersBar, TicketFilters, defaultFilters } from '@/components/tickets/ticket-filters';
import { TicketTable } from '@/components/tickets/ticket-table';
import { NewTicketModal } from '@/components/tickets/new-ticket-modal';
import {
    Plus,
    RefreshCw,
    Ticket as TicketIcon,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    UserPlus,
    UserCheck,
    ArrowUpCircle,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketStats {
    total: number;
    open: number;
    inProgress: number;
    urgent: number;
    resolvedToday: number;
}

export default function TicketsPage() {
    const { user, userData } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [filters, setFilters] = useState<TicketFilters>(defaultFilters);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Load tickets
    const loadTickets = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await TicketService.getTickets();
            setTickets(data);
        } catch (err) {
            console.error('Failed to load tickets:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTickets();

        // Real-time subscription
        const unsubscribe = TicketService.subscribeToTickets((updatedTickets) => {
            setTickets(updatedTickets);
        });

        return () => unsubscribe();
    }, []);

    // Filter tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter((ticket) => {
            // Status filter
            if (filters.status !== 'ALL' && ticket.status !== filters.status) return false;

            // Priority filter
            if (filters.priority !== 'ALL' && ticket.priority !== filters.priority) return false;

            // Category filter
            if (filters.category !== 'ALL' && ticket.category !== filters.category) return false;

            // Assignee filter
            if (filters.assignee === 'UNASSIGNED' && ticket.assignedTo) return false;
            if (filters.assignee === 'MINE' && ticket.assignedTo !== user?.uid) return false;

            // Search filter
            if (filters.search) {
                const query = filters.search.toLowerCase();
                const matchesId = ticket.ticketId?.toString().includes(query);
                const matchesSubject = ticket.subject.toLowerCase().includes(query);
                const matchesAuthor = (ticket.authorEmail?.toLowerCase().includes(query) || ticket.authorName?.toLowerCase().includes(query));
                if (!matchesId && !matchesSubject && !matchesAuthor) return false;
            }

            return true;
        });
    }, [tickets, filters, user?.uid]);

    // Paginated tickets
    const paginatedTickets = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredTickets.slice(start, start + pageSize);
    }, [filteredTickets, page, pageSize]);

    const totalPages = Math.ceil(filteredTickets.length / pageSize);

    // Calculate stats
    const stats: TicketStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'OPEN').length,
            inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
            urgent: tickets.filter(t => t.priority === 'URGENT' && t.status !== 'CLOSED').length,
            resolvedToday: tickets.filter(t => {
                if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
                const closedAt = t.closedAt?.toDate?.() || (t.closedAt ? new Date((t.closedAt as any).seconds * 1000) : null);
                return closedAt && closedAt >= today;
            }).length,
        };
    }, [tickets]);

    // Bulk actions
    const handleBulkAssign = async () => {
        if (!user || !userData || selectedIds.size === 0) return;
        await TicketService.bulkAssign(Array.from(selectedIds), user.uid, userData.name || 'Staff');
        setSelectedIds(new Set());
        loadTickets(true);
    };

    const handleBulkClose = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Close ${selectedIds.size} selected ticket(s)?`)) return;
        await TicketService.bulkUpdateStatus(Array.from(selectedIds), 'CLOSED');
        setSelectedIds(new Set());
        loadTickets(true);
    };

    // Quick actions
    const handleQuickAssign = async (ticketId: string) => {
        if (!user || !userData) return;
        await TicketService.assignTicket(ticketId, user.uid, userData.name || 'Staff');
        loadTickets(true);
    };

    const handleQuickClose = async (ticketId: string) => {
        await TicketService.updateStatus(ticketId, 'CLOSED');
        loadTickets(true);
    };

    const handleQuickEscalate = async (ticketId: string) => {
        await TicketService.escalateTicket(ticketId, 'URGENT');
        loadTickets(true);
    };

    const handleSyncNames = async () => {
        setSyncing(true);
        try {
            const count = await TicketService.syncTicketNames();
            if (count > 0) {
                alert(`Successfully synced names for ${count} tickets!`);
                loadTickets(true);
            } else {
                alert('All tickets are already synced!');
            }
        } catch (err) {
            console.error('Failed to sync names:', err);
            alert('Failed to sync names. Check console for details.');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <TicketIcon className="h-7 w-7 text-[#f97316]" />
                        Tickets
                    </h1>
                    <p className="text-[#8b949e] mt-1">
                        Manage support requests, reports, and appeals.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncNames}
                        disabled={syncing}
                        title="Sync Missing Names"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors disabled:opacity-50"
                    >
                        <UserCheck className={cn("h-4 w-4", syncing && "animate-pulse")} />
                        <span className="text-xs font-medium hidden md:inline">Sync Names</span>
                    </button>
                    <button
                        onClick={() => loadTickets(true)}
                        disabled={refreshing}
                        className="p-2 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                    >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#f9a825] via-[#f97316] to-[#ea580c] text-white font-medium text-sm hover:brightness-110 transition-all shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="h-4 w-4" />
                        New Ticket
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#f97316]/10">
                            <TicketIcon className="h-5 w-5 text-[#f97316]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Clock className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.open}</p>
                            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Open</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <UserPlus className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">In Progress</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.urgent}</p>
                            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Urgent</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <CheckCircle2 className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.resolvedToday}</p>
                            <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Resolved Today</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                <TicketFiltersBar
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                        setFilters(newFilters);
                        setPage(1); // Reset to page 1 when filters change
                    }}
                    currentUserId={user?.uid}
                />
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-[#0d1117] rounded-xl p-4 border border-[#f97316]/30 flex items-center justify-between">
                    <span className="text-sm text-white">
                        <span className="font-bold text-[#f97316]">{selectedIds.size}</span> ticket{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkAssign}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            Assign to Me
                        </button>
                        <button
                            onClick={handleBulkClose}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            Close Selected
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#8b949e] hover:text-white transition-colors"
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Ticket Table */}
            <TicketTable
                tickets={paginatedTickets}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onQuickAssign={handleQuickAssign}
                onQuickClose={handleQuickClose}
                onQuickEscalate={handleQuickEscalate}
                loading={loading}
            />

            {/* Pagination */}
            {filteredTickets.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[#8b949e]">Show</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="px-2 py-1 text-xs rounded-lg border border-[#30363d] bg-[#0d1117] text-white focus:outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-[#8b949e]">per page</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#8b949e]">
                            Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filteredTickets.length)} of {filteredTickets.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                            page === pageNum
                                                ? "bg-[#f97316] text-white"
                                                : "border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Ticket Modal */}
            <NewTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => loadTickets(true)}
            />
        </div>
    );
}
