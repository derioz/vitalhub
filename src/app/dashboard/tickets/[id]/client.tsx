'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { TicketService } from '@/services/ticket-service';
import { UserService } from '@/services/user-service';
import { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';
import { User as UserType } from '@/types/user';
import { TicketChat } from '@/components/tickets/ticket-chat';
import { getCategoryConfig } from '@/lib/ticket-categories';
import { formatDistanceToNow, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
    ArrowLeft,
    Clock,
    Tag,
    User,
    UserPlus,
    ArrowUpCircle,
    XCircle,
    CheckCircle2,
    RefreshCw,
    AlertTriangle,
    Calendar,
    Hash,
    MessageSquare,
    ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Props {
    id: string;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string }[] = [
    { value: 'OPEN', label: 'Open', color: 'bg-green-500' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'WAITING_ON_USER', label: 'Waiting on User', color: 'bg-yellow-500' },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-purple-500' },
    { value: 'CLOSED', label: 'Closed', color: 'bg-slate-500' },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string; color: string }[] = [
    { value: 'URGENT', label: '🔴 Urgent', color: 'text-red-400' },
    { value: 'HIGH', label: '🟠 High', color: 'text-orange-400' },
    { value: 'NORMAL', label: '🔵 Normal', color: 'text-blue-400' },
    { value: 'LOW', label: '🟢 Low', color: 'text-green-400' },
];

export function TicketDetailClient({ id }: Props) {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [staffMembers, setStaffMembers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const ADMIN_ROLES = ['role_admin', 'role_head_admin', 'role_owner', 'role_developer'];
    const isAdmin = (userData?.roles || []).some((r: string) => ADMIN_ROLES.includes(r));

    useEffect(() => {
        loadTicket();
    }, [id]);

    const loadTicket = async () => {
        setLoading(true);
        try {
            const data = await TicketService.getTicket(id);
            if (data) {
                // Auto-sync name if missing
                if (!data.authorName && data.authorId) {
                    const authorDoc = await UserService.getUser(data.authorId);
                    if (authorDoc?.name) {
                        data.authorName = authorDoc.name;
                        // Silently update Firestore
                        TicketService.updateTicketMetadata(data.id, { authorName: data.authorName });
                    }
                }
            }
            setTicket(data);

            // Fetch staff if admin
            if (isAdmin) {
                const staff = await UserService.getStaffMembers();
                setStaffMembers(staff);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: TicketStatus) => {
        if (!ticket) return;
        setUpdating(true);
        try {
            await TicketService.updateStatus(ticket.id, status);
            setTicket(prev => prev ? { ...prev, status } : null);
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePriority = async (priority: TicketPriority) => {
        if (!ticket) return;
        setUpdating(true);
        try {
            await TicketService.escalateTicket(ticket.id, priority);
            setTicket(prev => prev ? { ...prev, priority } : null);
        } catch (err) {
            console.error(err);
            alert('Failed to update priority');
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignToMe = async () => {
        if (!ticket || !user || !userData) return;
        setUpdating(true);
        try {
            await TicketService.assignTicket(ticket.id, user.uid, userData.name || 'Staff');
            setTicket(prev => prev ? {
                ...prev,
                assignedTo: user.uid,
                assignedToName: userData.name || 'Staff',
                status: 'IN_PROGRESS'
            } : null);
        } catch (err) {
            console.error(err);
            alert('Failed to assign ticket');
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignToUser = async (userId: string) => {
        if (!ticket) return;

        // Find user name
        const staff = staffMembers.find(s => s.id === userId);
        const staffName = staff?.name || staff?.username || 'Staff Member';

        setUpdating(true);
        try {
            await TicketService.assignTicket(ticket.id, userId, staffName);
            setTicket(prev => prev ? {
                ...prev,
                assignedTo: userId,
                assignedToName: staffName,
                status: 'IN_PROGRESS'
            } : null);
        } catch (err) {
            console.error(err);
            alert('Failed to assign ticket');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'OPEN': 'bg-green-500/10 text-green-400 border-green-500/30',
            'IN_PROGRESS': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            'WAITING_ON_USER': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
            'RESOLVED': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            'CLOSED': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        };
        return styles[status] || styles['CLOSED'];
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            'URGENT': 'bg-red-500/10 text-red-400 border-red-500/30',
            'HIGH': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
            'NORMAL': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            'LOW': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        };
        return styles[priority] || styles['NORMAL'];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-2 border-[#f97316] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Ticket Not Found</h2>
                <p className="text-[#8b949e] mb-4">The ticket you're looking for doesn't exist or has been deleted.</p>
                <Link
                    href="/dashboard/tickets"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#21262d] text-white hover:bg-[#30363d] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tickets
                </Link>
            </div>
        );
    }

    const categoryConfig = getCategoryConfig(ticket.category);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => router.push('/dashboard/tickets')}
                    className="p-2 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors mt-1"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="flex items-center gap-1 text-sm font-mono text-[#8b949e]">
                            <Hash className="h-4 w-4" />
                            {ticket.ticketId}
                        </span>
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getStatusBadge(ticket.status))}>
                            {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", getPriorityBadge(ticket.priority))}>
                            {ticket.priority === 'URGENT' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                            {ticket.priority}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{ticket.subject}</h1>
                    <p className="text-[#8b949e] text-sm mt-1">
                        Created by <span className="text-[#58a6ff]">{ticket.authorName || ticket.authorEmail}</span>
                        {' • '}
                        {ticket.createdAt?.seconds
                            ? formatDistanceToNow(new Date(ticket.createdAt.seconds * 1000), { addSuffix: true })
                            : 'Just now'}
                    </p>
                </div>
                <button
                    onClick={loadTicket}
                    disabled={updating}
                    className="p-2 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                >
                    <RefreshCw className={cn("h-4 w-4", updating && "animate-spin")} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#21262d] bg-[#161b22]">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-[#f97316]" />
                                Description
                            </h3>
                        </div>
                        <div className="p-5 prose prose-invert prose-sm max-w-none text-[#e6edf3] break-words">
                            <ReactMarkdown>
                                {ticket.description || 'No description provided.'}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <TicketChat ticketId={ticket.id} />
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#21262d] bg-[#161b22]">
                            <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            <button
                                onClick={handleAssignToMe}
                                disabled={updating || ticket.assignedTo === user?.uid}
                                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                            >
                                <UserPlus className="h-4 w-4" />
                                {ticket.assignedTo === user?.uid ? 'Assigned to You' : 'Assign to Me'}
                            </button>
                            <button
                                onClick={() => handleUpdatePriority('URGENT')}
                                disabled={updating || ticket.priority === 'URGENT'}
                                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                            >
                                <ArrowUpCircle className="h-4 w-4" />
                                Escalate to Urgent
                            </button>
                            {ticket.status !== 'CLOSED' ? (
                                <button
                                    onClick={() => handleUpdateStatus('CLOSED')}
                                    disabled={updating}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Close Ticket
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpdateStatus('OPEN')}
                                    disabled={updating}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Reopen Ticket
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#21262d] bg-[#161b22]">
                            <h3 className="text-sm font-semibold text-white">Details</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Status Dropdown */}
                            <div>
                                <label className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider mb-1.5 block">
                                    Status
                                </label>
                                <select
                                    value={ticket.status}
                                    onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                                    disabled={updating}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#30363d] bg-[#161b22] text-white focus:outline-none focus:border-[#f97316] disabled:opacity-50"
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority Dropdown */}
                            <div>
                                <label className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider mb-1.5 block">
                                    Priority
                                </label>
                                <select
                                    value={ticket.priority}
                                    onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                                    disabled={updating}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#30363d] bg-[#161b22] text-white focus:outline-none focus:border-[#f97316] disabled:opacity-50"
                                >
                                    {PRIORITY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider mb-1.5 block">
                                    Category
                                </label>
                                <div className={cn(
                                    "px-3 py-2 rounded-lg border text-sm",
                                    categoryConfig.bgColor,
                                    categoryConfig.color,
                                    categoryConfig.borderColor
                                )}>
                                    {categoryConfig.emoji} {categoryConfig.label}
                                </div>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider mb-1.5 block">
                                    Assignee
                                </label>
                                {isAdmin ? (
                                    <select
                                        value={ticket.assignedTo || ''}
                                        onChange={(e) => handleAssignToUser(e.target.value)}
                                        disabled={updating}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-[#30363d] bg-[#161b22] text-white focus:outline-none focus:border-[#f97316] disabled:opacity-50"
                                    >
                                        <option value="">Unassigned</option>
                                        {staffMembers.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name || staff.username || 'Unknown Staff'}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#30363d] bg-[#161b22]">
                                        <User className="h-4 w-4 text-[#8b949e]" />
                                        <span className={ticket.assignedToName ? "text-blue-400" : "text-[#484f58] italic"}>
                                            {ticket.assignedToName || 'Unassigned'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Author */}
                            <div>
                                <label className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider mb-1.5 block">
                                    Author
                                </label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#30363d] bg-[#161b22]">
                                    <User className="h-4 w-4 text-[#8b949e]" />
                                    <span className="text-[#e6edf3]">{ticket.authorName || ticket.authorEmail}</span>
                                </div>
                            </div>

                            {/* Created */}
                            <div>
                                <label className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider mb-1.5 block">
                                    Created
                                </label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#30363d] bg-[#161b22]">
                                    <Calendar className="h-4 w-4 text-[#8b949e]" />
                                    <span className="text-[#e6edf3] text-sm">
                                        {ticket.createdAt?.seconds
                                            ? format(new Date(ticket.createdAt.seconds * 1000), 'MMM d, yyyy h:mm a')
                                            : 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Last Updated */}
                            <div>
                                <label className="text-[10px] font-medium text-[#8b949e] uppercase tracking-wider mb-1.5 block">
                                    Last Updated
                                </label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#30363d] bg-[#161b22]">
                                    <Clock className="h-4 w-4 text-[#8b949e]" />
                                    <span className="text-[#e6edf3] text-sm">
                                        {ticket.updatedAt?.seconds
                                            ? formatDistanceToNow(new Date(ticket.updatedAt.seconds * 1000), { addSuffix: true })
                                            : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
