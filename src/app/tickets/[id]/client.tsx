'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { TicketService } from '@/services/ticket-service';
import { Ticket } from '@/types/ticket';
import { TicketChat } from '@/components/tickets/ticket-chat';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Clock, Loader2, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getCategoryConfig } from '@/lib/ticket-categories';

interface Props {
    id: string;
}

export function TicketClient({ id }: Props) {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTicket = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await TicketService.getTicket(id);
                // Security check: Only allow author or staff to view
                const STAFF_ROLES = ['role_support', 'role_sr_support', 'role_mod', 'role_sr_mod', 'role_admin', 'role_head_admin', 'role_owner', 'role_developer'];
                const isStaff = (userData?.roles || []).some((r: string) => STAFF_ROLES.includes(r));

                if (data && (data.authorId === user.uid || isStaff)) {
                    setTicket(data);
                } else {
                    setTicket(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadTicket();
    }, [id, user, userData]);

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'OPEN': return 1;
            case 'IN_PROGRESS':
            case 'WAITING_ON_USER': return 2;
            case 'RESOLVED':
            case 'CLOSED': return 3;
            default: return 1;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <AlertTriangle className="h-12 w-12 text-[#f97316]" />
                <h1 className="text-2xl font-bold text-white">Ticket Not Found</h1>
                <p className="text-[#8b949e]">You don't have permission to view this ticket or it doesn't exist.</p>
                <Link href="/tickets" className="text-[#f97316] hover:underline">Return to Tickets</Link>
            </div>
        );
    }

    const categoryConfig = getCategoryConfig(ticket.category);
    const currentStep = getStatusStep(ticket.status);

    return (
        <div className="min-h-screen bg-[#0d1117] font-sans text-slate-200">
            {/* Header */}
            <div className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/tickets" className="p-2 -ml-2 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                                <span className="font-mono">#{ticket.ticketId}</span>
                                <span>•</span>
                                <span>Support Ticket</span>
                            </div>
                            <h1 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">{ticket.subject}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Details (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Status Stepper */}
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
                            <h3 className="text-sm font-bold text-white mb-6">Ticket Status</h3>
                            <div className="relative space-y-8">
                                {/* Line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[#30363d]" />

                                {/* Step 1: Open */}
                                <div className="relative flex items-start gap-4">
                                    <div className={cn("relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors bg-[#161b22]",
                                        currentStep >= 1 ? "border-green-500 text-green-500" : "border-[#30363d] text-[#8b949e]"
                                    )}>
                                        {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 fill-current" />}
                                    </div>
                                    <div className="pt-1">
                                        <p className={cn("font-semibold text-sm", currentStep >= 1 ? "text-white" : "text-[#8b949e]")}>Ticket Opened</p>
                                        <p className="text-xs text-[#8b949e]">Request received.</p>
                                    </div>
                                </div>

                                {/* Step 2: In Progress */}
                                <div className="relative flex items-start gap-4">
                                    <div className={cn("relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors bg-[#161b22]",
                                        currentStep >= 2 ? "border-blue-500 text-blue-500" : "border-[#30363d] text-[#8b949e]"
                                    )}>
                                        {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : (currentStep === 2 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Circle className="w-5 h-5" />)}
                                    </div>
                                    <div className="pt-1">
                                        <p className={cn("font-semibold text-sm", currentStep >= 2 ? "text-white" : "text-[#8b949e]")}>In Progress</p>
                                        <p className="text-xs text-[#8b949e]">Staff is reviewing.</p>
                                    </div>
                                </div>

                                {/* Step 3: Resolved */}
                                <div className="relative flex items-start gap-4">
                                    <div className={cn("relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors bg-[#161b22]",
                                        currentStep >= 3 ? "border-gray-500 text-gray-400" : "border-[#30363d] text-[#8b949e]"
                                    )}>
                                        {currentStep >= 3 ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </div>
                                    <div className="pt-1">
                                        <p className={cn("font-semibold text-sm", currentStep >= 3 ? "text-white" : "text-[#8b949e]")}>Resolved</p>
                                        <p className="text-xs text-[#8b949e]">Issue completed.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider mb-3">Details</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[#8b949e]">Category</span>
                                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border",
                                            categoryConfig.bgColor, categoryConfig.color, categoryConfig.borderColor)}>
                                            {categoryConfig.emoji} {categoryConfig.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[#8b949e]">Priority</span>
                                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded border",
                                            ticket.priority === 'URGENT' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                ticket.priority === 'HIGH' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                    "bg-[#21262d] text-[#8b949e] border-[#30363d]"
                                        )}>
                                            {ticket.priority || 'NORMAL'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[#8b949e]">Created</span>
                                        <span className="text-sm text-white font-mono">{formatDistanceToNow(new Date(ticket.createdAt.seconds * 1000), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[#30363d] pt-6">
                                <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-wider mb-3">Description</h3>
                                <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d]">
                                    <p className="text-sm text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                                </div>
                            </div>

                            {ticket.assignedToName && (
                                <div className="border-t border-[#30363d] pt-6 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-[#21262d] flex items-center justify-center border border-[#30363d]">
                                        <ShieldCheck className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#8b949e] font-bold">Supported by</p>
                                        <p className="text-sm font-bold text-white">{ticket.assignedToName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Chat (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)]">
                        <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-[#30363d] bg-[#0d1117]/30 flex items-center justify-between">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-[#f97316]" />
                                    Conversation
                                </h3>
                                {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <TicketChat ticketId={ticket.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
