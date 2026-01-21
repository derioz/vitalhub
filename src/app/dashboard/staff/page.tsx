'use client';

import { useEffect, useState, useMemo } from 'react';
import { UserService } from '@/services/user-service';
import { User, Role } from '@/types/user';
import { UserRoleModal } from '@/components/staff/user-role-modal';
import { AddUserModal } from '@/components/staff/add-user-modal';
import { Search, Shield, Filter, Users, ShieldAlert, BadgeCheck, Clock, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { formatDistanceToNow } from 'date-fns';

export default function StaffPage() {
    const { userData } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Access control: role_admin, role_head_admin, role_owner, role_developer
    const hasAccess = useMemo(() => {
        const allowed = ['role_admin', 'role_head_admin', 'role_owner', 'role_developer'];
        return (userData?.roles || []).some((r: string) => allowed.includes(r));
    }, [userData]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [u, r] = await Promise.all([
                UserService.getAllUsers(),
                UserService.getRoles()
            ]);
            setUsers(u);
            setRoles(r);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getRoleConfig = (user: User) => {
        if (user.customColor) {
            return { color: user.customColor, name: 'Custom override' };
        }
        // Find highest order role
        const userRoles = roles.filter(r => user.roles?.includes(r.id));
        if (userRoles.length === 0) return { name: 'No Role', color: '#666' };

        return userRoles.sort((a, b) => a.order - b.order)[0];
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            admins: users.filter(u => u.roles?.some(r => ['role_admin', 'role_head_admin', 'role_owner'].includes(r))).length,
            moderators: users.filter(u => u.roles?.some(r => ['role_mod', 'role_sr_mod'].includes(r))).length,
            support: users.filter(u => u.roles?.some(r => ['role_support', 'role_sr_support'].includes(r))).length,
        };
    }, [users]);

    if (!hasAccess && !loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
                    <ShieldAlert className="h-12 w-12 text-red-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white">Access Denied</h3>
                    <p className="text-slate-400">You do not have permission to view the staff database.</p>
                </div>
            </div>
        );
    }

    if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading staff database...</div>;

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">Staff Team</h2>
                    <p className="text-slate-400 text-lg">Manage permissions and oversee the administrative team.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-start transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-brand-start w-64 transition-all"
                        />
                    </div>
                    <button className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors">
                        <Filter className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-start to-brand-end text-white text-sm font-bold shadow-lg shadow-brand-end/20 hover:brightness-110 transition-all"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total Users" value={stats.total} icon={<Users className="text-blue-400" />} />
                <StatsCard title="Administrators" value={stats.admins} icon={<BadgeCheck className="text-amber-400" />} />
                <StatsCard title="Moderators" value={stats.moderators} icon={<Shield className="text-violet-400" />} />
                <StatsCard title="Support Team" value={stats.support} icon={<Shield className="text-emerald-400" />} />
            </div>

            {/* Staff Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-widest text-[10px] bg-slate-900/60">
                                <th className="px-6 py-5">Identified User</th>
                                <th className="px-6 py-5">Assigned Roles</th>
                                <th className="px-6 py-5">Account Status</th>
                                <th className="px-6 py-5 text-right">Activity</th>
                                <th className="px-8 py-5 text-center">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredUsers.map((u) => {
                                const mainRole = getRoleConfig(u);
                                return (
                                    <tr key={u.id} className="hover:bg-slate-800/20 group transition-all duration-300">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="h-11 w-11 rounded-xl bg-slate-800 overflow-hidden ring-1 ring-white/5 shadow-lg">
                                                        {u.avatarUrl ? (
                                                            <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                                                {u.username.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div
                                                        className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-900"
                                                        style={{ backgroundColor: mainRole.color }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base leading-tight group-hover:text-brand-start transition-colors">
                                                        {u.name || u.username}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                {(u.roles || []).map(rid => {
                                                    const role = roles.find(r => r.id === rid);
                                                    if (!role) return null;
                                                    return (
                                                        <span
                                                            key={rid}
                                                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold border whitespace-nowrap"
                                                            style={{
                                                                borderColor: `${role.color}30`,
                                                                backgroundColor: `${role.color}10`,
                                                                color: role.color
                                                            }}
                                                        >
                                                            {role.name}
                                                        </span>
                                                    )
                                                })}
                                                {u.customColor && (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-white/10 bg-white/5 text-white">
                                                        Paint Over
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={u.status || 'ACTIVE'} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                                                    <Clock className="h-3 w-3 text-slate-500" />
                                                    {u.lastLoginAt?.seconds
                                                        ? formatDistanceToNow(u.lastLoginAt.seconds * 1000, { addSuffix: true })
                                                        : 'Never logged in'}
                                                </div>
                                                <p className="text-[10px] text-slate-600 font-mono">ID: {u.id.substring(0, 8)}...</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <button
                                                onClick={() => setEditingUser(u)}
                                                className="p-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-400 hover:text-brand-start hover:border-brand-start/50 hover:bg-brand-start/5 transition-all shadow-sm"
                                            >
                                                <Shield className="h-4.5 w-4.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-20 text-center border-t border-slate-800">
                        <Users className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <h4 className="text-white font-bold">No users found</h4>
                        <p className="text-slate-500 text-sm">Adjust your search or filters and try again.</p>
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <AddUserModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={loadData}
                />
            )}

            {editingUser && (
                <UserRoleModal
                    isOpen={!!editingUser}
                    user={editingUser}
                    allRoles={roles}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => {
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

function StatsCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-xl hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-slate-800/50 ring-1 ring-white/5">
                    {icon}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active</span>
            </div>
            <div>
                <p className="text-3xl font-black text-white mb-1">{value}</p>
                <p className="text-sm font-semibold text-slate-500">{title}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string, bg: string, border: string, icon: string }> = {
        ACTIVE: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: '✅' },
        RESTRICTED: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: '⚠️' },
        BANNED: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: '🚫' },
    };

    const statusConfig = config[status] || { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: '❓' };

    return (
        <span className={cn(
            "flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            statusConfig.color, statusConfig.bg, statusConfig.border
        )}>
            <span>{statusConfig.icon}</span>
            {status}
        </span>
    );
}

