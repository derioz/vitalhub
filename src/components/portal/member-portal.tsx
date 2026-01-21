'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { TicketService } from '@/services/ticket-service';
import { SuggestionService } from '@/services/suggestion-service';
import { UserService } from '@/services/user-service';
import { WikiService } from '@/services/wiki-service';
import { Ticket } from '@/types/ticket';
import { Suggestion } from '@/types/suggestion';
import { WikiDocument } from '@/types/wiki';
import { NewTicketModal } from '@/components/tickets/new-ticket-modal';
import { NewSuggestionModal } from '@/components/portal/new-suggestion-modal';
import {
    MessageSquare,
    Lightbulb,
    Shield,
    Plus,
    Clock,
    LogOut,
    LayoutDashboard,
    ChevronRight,
    Signal,
    Users,
    Activity,
    FileText,
    ExternalLink,
    Megaphone,
    UserCheck,
    Gamepad2,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

export function MemberPortal() {
    const { user, userData, logout } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [announcements, setAnnouncements] = useState<WikiDocument[]>([]);
    const [staffCount, setStaffCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

    const STAFF_ROLES = ['role_support', 'role_sr_support', 'role_mod', 'role_sr_mod', 'role_admin', 'role_head_admin', 'role_owner', 'role_developer'];
    const isStaff = useMemo(() => {
        return (userData?.roles || []).some((r: string) => STAFF_ROLES.includes(r));
    }, [userData]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);

        // Tickets
        try {
            const t = await TicketService.getMemberTickets(user.uid);
            setTickets(t);
        } catch (error) {
            console.error("Failed to load tickets:", error);
        }

        // Suggestions
        try {
            const s = await SuggestionService.getAll();
            setSuggestions(s.slice(0, 5));
        } catch (error) {
            console.error("Failed to load suggestions:", error);
        }

        // Staff Count
        try {
            const staff = await UserService.getStaffMembers();
            setStaffCount(staff.length);
        } catch (error) {
            console.error("Failed to load staff count:", error);
        }

        // Announcements
        try {
            const news = await WikiService.getAnnouncements();
            setAnnouncements(news);
        } catch (error) {
            console.error("Failed to load announcements:", error);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
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

    return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col font-sans text-[#c9d1d9]">
            {/* Top Navigation */}
            <nav className="z-40 sticky top-0 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10">
                            <Image src="/logo.png" alt="Vital Logo" fill className="object-contain" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Vital<span className="text-orange-500">Hub</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isStaff && (
                        <Link
                            href="/dashboard"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-all text-sm font-medium"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Staff Panel
                        </Link>
                    )}

                    <div className="h-6 w-px bg-[#30363d] mx-2 hidden md:block" />

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white leading-tight">{userData?.name || userData?.username}</p>
                            <p className="text-xs text-[#8b949e]">Vital Member</p>
                        </div>
                        <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-[#30363d]"
                            style={{ backgroundColor: userData?.customColor || '#f97316' }}
                        >
                            {userData?.name?.charAt(0) || userData?.username?.charAt(0)}
                        </div>
                        <button
                            onClick={() => logout()}
                            title="Sign Out"
                            className="p-2 rounded-md text-[#8b949e] hover:text-red-400 hover:bg-[#21262d] transition-all ml-2"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 space-y-8">
                {/* Hero / Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Welcome Card */}
                    <div className="md:col-span-3 relative overflow-hidden rounded-xl bg-[#161b22] border border-[#30363d] p-8 flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Welcome back, {userData?.name || userData?.username}
                            </h1>
                            <p className="text-[#8b949e] max-w-lg mb-6 text-lg">
                                Your central hub for managing tickets, viewing announcements, and shaping the city through suggestions.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setIsTicketModalOpen(true)}
                                    className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Support Ticket
                                </button>
                                <button
                                    onClick={() => setIsSuggestionModalOpen(true)}
                                    className="px-5 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] font-semibold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                    Submit Idea
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Staff Online Widget (New) */}
                    <div className="md:col-span-1 rounded-xl bg-[#161b22] border border-[#30363d] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="relative">
                                <UserCheck className="h-8 w-8 text-blue-400" />
                                <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#161b22] animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">{staffCount}</h3>
                                <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">Staff Online</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#8b949e] mt-2">
                            Our team is active and ready to assist you with any inquiries.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Tickets & Quick Links */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <a href="#" className="flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#5865f2] transition-all group">
                                <div className="h-10 w-10 rounded-lg bg-[#5865f2]/10 flex items-center justify-center">
                                    <Globe className="h-5 w-5 text-[#5865f2]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-[#5865f2] transition-colors">Discord</h4>
                                    <p className="text-xs text-[#8b949e]">Join the community</p>
                                </div>
                            </a>
                            <a href="#" className="flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-green-500 transition-all group">
                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Gamepad2 className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-green-500 transition-colors">Connect</h4>
                                    <p className="text-xs text-[#8b949e]">Join the server</p>
                                </div>
                            </a>
                            <a href="#" className="flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-purple-500 transition-all group">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">Rules</h4>
                                    <p className="text-xs text-[#8b949e]">Read server rules</p>
                                </div>
                            </a>
                        </div>

                        {/* My Tickets */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-[#8b949e]" />
                                    My Tickets
                                </h2>
                                <Link href="/tickets" className="text-sm text-[#8b949e] hover:text-white flex items-center gap-1">
                                    View All <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden">
                                {loading ? (
                                    <div className="p-8 text-center text-[#8b949e]">Loading tickets...</div>
                                ) : tickets.length > 0 ? (
                                    <div className="divide-y divide-[#21262d]">
                                        {tickets.map(ticket => (
                                            <Link
                                                key={ticket.id}
                                                href={`/tickets/${ticket.id}`}
                                                className="block p-4 hover:bg-[#21262d]/50 transition-colors group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#8b949e] font-mono text-xs">
                                                            <span>#{ticket.ticketId}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                                {ticket.subject}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-[#8b949e]">
                                                                <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase", getStatusColor(ticket.status))}>
                                                                    {ticket.status.replace('_', ' ')}
                                                                </span>
                                                                <span>•</span>
                                                                <Clock className="h-3 w-3" />
                                                                <span>{formatDistanceToNow(ticket.createdAt.seconds * 1000, { addSuffix: true })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-[#30363d] group-hover:text-[#8b949e] transition-colors" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center flex flex-col items-center">
                                        <div className="h-12 w-12 rounded-full bg-[#21262d] flex items-center justify-center mb-4">
                                            <MessageSquare className="h-6 w-6 text-[#8b949e]" />
                                        </div>
                                        <p className="text-white font-medium">No active tickets</p>
                                        <p className="text-sm text-[#8b949e] mt-1 max-w-xs">
                                            You haven't created any support tickets yet. Need help with something?
                                        </p>
                                        <button
                                            onClick={() => setIsTicketModalOpen(true)}
                                            className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
                                        >
                                            Create your first ticket
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Status & Feed */}
                    <div className="space-y-6">
                        {/* Server Status */}
                        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-500" />
                                    Server Status
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase">
                                    Online
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-[#8b949e]">Los Santos</span>
                                        <span className="text-white font-mono">124/200</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#30363d] rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[62%]" />
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center gap-3">
                                    <Signal className="h-5 w-5 text-[#8b949e]" />
                                    <div>
                                        <p className="text-xs font-bold text-white">Stable Connection</p>
                                        <p className="text-[10px] text-[#8b949e]">Ping: 24ms • Uptime: 4d 12h</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Announcements Widget (New) */}
                        <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden">
                            <div className="p-4 border-b border-[#30363d] bg-gradient-to-r from-[#1f2937] to-[#161b22]">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Megaphone className="h-4 w-4 text-red-500" />
                                    Announcements
                                </h3>
                            </div>
                            <div className="divide-y divide-[#21262d]">
                                {announcements.length > 0 ? announcements.map(doc => (
                                    <Link key={doc.id} href={`/dashboard/wiki/${doc.id}`} className="block p-4 hover:bg-[#21262d]/50 transition-colors">
                                        <h4 className="text-sm font-bold text-white mb-1">{doc.title}</h4>
                                        <p className="text-xs text-[#8b949e] line-clamp-2">{doc.content.substring(0, 100)}...</p>
                                        <p className="text-[10px] text-[#8b949e] mt-2 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {doc.createdAt && formatDistanceToNow(doc.createdAt.seconds * 1000, { addSuffix: true })}
                                        </p>
                                    </Link>
                                )) : (
                                    <div className="p-6 text-center text-xs text-[#8b949e]">
                                        No recent announcements.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Suggestions */}
                        <div className="rounded-xl bg-[#161b22] border border-[#30363d] overflow-hidden">
                            <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                                    Community Ideas
                                </h3>
                            </div>
                            <div className="divide-y divide-[#21262d]">
                                {suggestions.map(s => (
                                    <div key={s.id} className="p-4 hover:bg-[#21262d]/50 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-white line-clamp-2">{s.title}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">
                                                        {(s.upvotes || []).length} Votes
                                                    </span>
                                                    <span className="text-[10px] text-[#8b949e]">by {s.authorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {suggestions.length === 0 && (
                                    <div className="p-6 text-center text-xs text-[#8b949e]">
                                        No suggestions yet. Be the first!
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsSuggestionModalOpen(true)}
                                className="w-full py-3 text-xs font-bold text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors border-t border-[#30363d]"
                            >
                                + Submit New Idea
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <NewTicketModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                onSuccess={loadData}
            />

            <NewSuggestionModal
                isOpen={isSuggestionModalOpen}
                onClose={() => setIsSuggestionModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}
