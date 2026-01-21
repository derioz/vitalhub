'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
    ChevronDown,
    ChevronUp,
    UserPlus,
    XCircle,
    ArrowUpCircle,
    MoreHorizontal,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { Ticket } from '@/types/ticket';
import { getCategoryConfig } from '@/lib/ticket-categories';
import { cn } from '@/lib/utils';

interface TicketTableProps {
    tickets: Ticket[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    onQuickAssign: (ticketId: string) => void;
    onQuickClose: (ticketId: string) => void;
    onQuickEscalate: (ticketId: string) => void;
    loading?: boolean;
}

type SortField = 'ticketId' | 'createdAt' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
const STATUS_ORDER = { OPEN: 0, IN_PROGRESS: 1, WAITING_ON_USER: 2, RESOLVED: 3, CLOSED: 4 };

export function TicketTable({
    tickets,
    selectedIds,
    onSelectionChange,
    onQuickAssign,
    onQuickClose,
    onQuickEscalate,
    loading
}: TicketTableProps) {
    const router = useRouter();
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const sortedTickets = [...tickets].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
            case 'ticketId':
                comparison = (a.ticketId || 0) - (b.ticketId || 0);
                break;
            case 'createdAt':
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                comparison = aTime - bTime;
                break;
            case 'priority':
                comparison = (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2);
                break;
            case 'status':
                comparison = (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0);
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const allSelected = tickets.length > 0 && selectedIds.size === tickets.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < tickets.length;

    const toggleAll = () => {
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(tickets.map(t => t.id)));
        }
    };

    const toggleOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        onSelectionChange(newSet);
    };

    const getPriorityIndicator = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Urgent" />;
            case 'HIGH':
                return <div className="h-2 w-2 rounded-full bg-orange-500" title="High" />;
            case 'NORMAL':
                return <div className="h-2 w-2 rounded-full bg-blue-500" title="Normal" />;
            case 'LOW':
                return <div className="h-2 w-2 rounded-full bg-gray-500" title="Low" />;
            default:
                return <div className="h-2 w-2 rounded-full bg-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'OPEN': 'bg-green-500/10 text-green-400 border-green-500/20',
            'IN_PROGRESS': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'WAITING_ON_USER': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            'RESOLVED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'CLOSED': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
        return (
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", styles[status] || styles['CLOSED'])}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 hover:text-white transition-colors"
        >
            {children}
            {sortField === field && (
                sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            )}
        </button>
    );

    if (loading) {
        return (
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-[#f97316] border-t-transparent rounded-full mx-auto" />
                <p className="text-[#8b949e] mt-4 text-sm">Loading tickets...</p>
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-[#22c55e] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                <p className="text-[#8b949e] text-sm">No tickets match your current filters.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#161b22] border-b border-[#21262d] text-[#8b949e] text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                    onChange={toggleAll}
                                    className="rounded border-[#30363d] bg-[#0d1117] text-[#f97316] focus:ring-[#f97316] focus:ring-offset-0"
                                />
                            </th>
                            <th className="px-4 py-3 w-8"></th>
                            <th className="px-4 py-3">
                                <SortHeader field="ticketId">ID</SortHeader>
                            </th>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">
                                <SortHeader field="status">Status</SortHeader>
                            </th>
                            <th className="px-4 py-3">Assignee</th>
                            <th className="px-4 py-3">Author</th>
                            <th className="px-4 py-3">
                                <SortHeader field="createdAt">Created</SortHeader>
                            </th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]">
                        {sortedTickets.map((ticket) => {
                            const categoryConfig = getCategoryConfig(ticket.category);
                            const isSelected = selectedIds.has(ticket.id);

                            return (
                                <tr
                                    key={ticket.id}
                                    className={cn(
                                        "hover:bg-[#161b22] transition-colors group",
                                        isSelected && "bg-[#f97316]/5"
                                    )}
                                >
                                    {/* Checkbox */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleOne(ticket.id)}
                                            className="rounded border-[#30363d] bg-[#0d1117] text-[#f97316] focus:ring-[#f97316] focus:ring-offset-0"
                                        />
                                    </td>

                                    {/* Priority Indicator */}
                                    <td className="px-4 py-3">
                                        {getPriorityIndicator(ticket.priority)}
                                    </td>

                                    {/* Ticket ID */}
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                                            className="font-mono text-[#8b949e] hover:text-[#f97316] transition-colors"
                                        >
                                            #{ticket.ticketId}
                                        </button>
                                    </td>

                                    {/* Subject */}
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                                            className="font-medium text-white hover:text-[#f97316] transition-colors text-left max-w-[300px] truncate block"
                                        >
                                            {ticket.priority === 'URGENT' && (
                                                <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5 text-red-500" />
                                            )}
                                            {ticket.subject}
                                        </button>
                                    </td>

                                    {/* Category */}
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                            categoryConfig.bgColor,
                                            categoryConfig.color,
                                            categoryConfig.borderColor
                                        )}>
                                            {categoryConfig.emoji} {categoryConfig.label}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        {getStatusBadge(ticket.status)}
                                    </td>

                                    {/* Assignee */}
                                    <td className="px-4 py-3">
                                        {ticket.assignedToName ? (
                                            <span className="text-blue-400 text-xs">{ticket.assignedToName}</span>
                                        ) : (
                                            <span className="text-[#484f58] text-xs italic">Unassigned</span>
                                        )}
                                    </td>

                                    {/* Author */}
                                    <td className="px-4 py-3 text-[#8b949e] text-xs">
                                        {ticket.authorName || ticket.authorEmail?.split('@')[0] || 'Unknown'}
                                    </td>

                                    {/* Created */}
                                    <td className="px-4 py-3 text-[#484f58] text-xs">
                                        {ticket.createdAt?.seconds
                                            ? formatDistanceToNow(new Date(ticket.createdAt.seconds * 1000), { addSuffix: true })
                                            : 'Just now'}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 relative">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onQuickAssign(ticket.id)}
                                                title="Assign to me"
                                                className="p-1.5 rounded text-[#8b949e] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onQuickEscalate(ticket.id)}
                                                title="Escalate"
                                                disabled={ticket.priority === 'URGENT'}
                                                className="p-1.5 rounded text-[#8b949e] hover:text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-30"
                                            >
                                                <ArrowUpCircle className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onQuickClose(ticket.id)}
                                                title="Close"
                                                disabled={ticket.status === 'CLOSED'}
                                                className="p-1.5 rounded text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
