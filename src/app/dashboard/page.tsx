'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import AdvancedCalendar from '@/components/dashboard/advanced-calendar';
import TicketCommandCenter from '@/components/dashboard/ticket-command-center';
import { DashboardService, DashboardStats, RecentActivity } from '@/services/dashboard-service';
import { Ticket, Lightbulb, FileText, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Role check: Only show calendar for staff roles
const CALENDAR_ALLOWED_ROLES = ['role_support', 'role_sr_support', 'role_mod', 'role_sr_mod', 'role_admin', 'role_head_admin', 'role_owner', 'role_developer'];

export default function DashboardOverview() {
    const { userData } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    // Check if user has proper role
    const userRoles = userData?.roles || [];
    const hasCalendarAccess = userRoles.some((role: string) =>
        CALENDAR_ALLOWED_ROLES.includes(role)
    );

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [fetchedStats, activity] = await Promise.all([
                    DashboardService.getStats(),
                    DashboardService.getRecentActivity(5)
                ]);
                setStats(fetchedStats);
                setRecentActivity(activity);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const statCards = [
        {
            label: 'Open Tickets',
            value: stats?.openTickets ?? 0,
            icon: Ticket,
            color: 'text-[#22c55e]',
            bg: 'bg-[#22c55e]/10'
        },
        {
            label: 'Pending Tickets',
            value: stats?.pendingTickets ?? 0,
            icon: AlertCircle,
            color: 'text-[#f59e0b]',
            bg: 'bg-[#f59e0b]/10'
        },
        {
            label: 'Suggestions',
            value: stats?.totalSuggestions ?? 0,
            icon: Lightbulb,
            color: 'text-[#3b82f6]',
            bg: 'bg-[#3b82f6]/10'
        },
        {
            label: 'Wiki Docs',
            value: stats?.wikiDocuments ?? 0,
            icon: FileText,
            color: 'text-[#a855f7]',
            bg: 'bg-[#a855f7]/10'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Overview
                    </h1>
                    <p className="text-[#8b949e] mt-1">
                        Welcome back, {userData?.name || 'Staff'}. Here's what's happening.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-[#161b22] rounded-xl p-5 border border-[#30363d] hover:border-[#484f58] transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#8b949e] font-medium">{stat.label}</p>
                                <p className="text-3xl font-bold text-white mt-1">
                                    {loading ? '—' : stat.value}
                                </p>
                            </div>
                            <div className={cn("p-3 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid: Command Center + Calendar */}
            <div className="grid grid-cols-2 gap-6">
                {/* Left Panel - Ticket Command Center */}
                <div>
                    {hasCalendarAccess ? (
                        <TicketCommandCenter />
                    ) : (
                        <div className="bg-[#161b22] rounded-xl p-8 border border-[#30363d] h-full flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-sm text-[#8b949e]">Staff access required</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel - Calendar */}
                <div>
                    {hasCalendarAccess ? (
                        <AdvancedCalendar />
                    ) : (
                        <div className="bg-[#161b22] rounded-xl p-8 border border-[#30363d] h-full flex items-center justify-center">
                            <div className="text-center max-w-md">
                                <div className="h-16 w-16 rounded-full bg-[#21262d] flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-8 w-8 text-[#484f58]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-white mb-2">
                                    Activity Calendar
                                </h2>
                                <p className="text-sm text-[#8b949e]">
                                    The activity calendar is available for Support Staff and above.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
