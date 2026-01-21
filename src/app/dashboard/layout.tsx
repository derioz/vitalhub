'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
    Users,
    Ticket,
    LayoutDashboard,
    FileText,
    Lightbulb,
    LogOut,
    Settings,
    User as UserIcon,
    ChevronLeft
} from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Staff', href: '/dashboard/staff', icon: Users },
    { name: 'Wiki', href: '/dashboard/wiki', icon: FileText },
    { name: 'Suggestions', href: '/dashboard/suggestions', icon: Lightbulb },
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0f1115] text-[#8b949e]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[#21262d] border-t-[#3b82f6] rounded-full animate-spin" />
                    <p className="text-sm font-medium animate-pulse">Initializing...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0f1115]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#21262d] bg-[#0f1115] flex flex-col">
                {/* Logo Section */}
                <div className="p-5 border-b border-[#21262d] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight text-white leading-none">
                                VITAL PANEL
                            </h1>
                        </div>
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-[#21262d] transition-colors">
                        <ChevronLeft className="h-4 w-4 text-[#484f58]" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <p className="px-3 py-2 text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">
                        Menus
                    </p>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-[#3b82f6]/10 text-[#3b82f6] border-l-2 border-[#3b82f6] ml-[-1px]"
                                        : "text-[#8b949e] hover:text-white hover:bg-[#21262d] border-l-2 border-transparent"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-[#3b82f6]" : "text-[#484f58] group-hover:text-[#8b949e]")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Account Settings Section */}
                <div className="p-3 border-t border-[#21262d]">
                    <p className="px-3 py-2 text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">
                        Account
                    </p>
                    <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors">
                        <Settings className="h-4 w-4 text-[#484f58]" />
                        Settings
                    </button>
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-[#21262d] flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#21262d] overflow-hidden relative">
                        {(userData?.photoURL || user.photoURL) ? (
                            <Image src={userData?.photoURL || user.photoURL} alt="" fill className="object-cover" />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]" />
                        )}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="font-medium text-sm text-white truncate">{userData?.name || user.displayName || 'User'}</p>
                        <p className="text-[#484f58] truncate text-xs">{userData?.roles?.[0]?.replace('role_', '') || 'Member'}</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-[#484f58] rotate-180" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#0f1115] p-8">
                {children}
            </main>
        </div>
    );
}
