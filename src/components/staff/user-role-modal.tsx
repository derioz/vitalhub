'use client';

import { useState, useEffect } from 'react';
import { User, Role } from '@/types/user';
import { UserService } from '@/services/user-service';
import { X, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
    allRoles: Role[];
}

export function UserRoleModal({ isOpen, onClose, onSuccess, user, allRoles }: Props) {
    const [loading, setLoading] = useState(false);
    // Local state for roles selection
    const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles || []);
    const [customColor, setCustomColor] = useState(user?.customColor || '');
    const [status, setStatus] = useState<User['status']>(user?.status || 'ACTIVE');

    // Sync state when user changes
    useEffect(() => {
        if (user) {
            setSelectedRoles(user.roles || []);
            setCustomColor(user.customColor || '');
            setStatus(user.status || 'ACTIVE');
        }
    }, [user?.id]);

    const handleToggleRole = (roleId: string) => {
        if (selectedRoles.includes(roleId)) {
            setSelectedRoles(prev => prev.filter(r => r !== roleId));
        } else {
            setSelectedRoles(prev => [...prev, roleId]);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await Promise.all([
                UserService.updateUserRoles(user.id, selectedRoles),
                UserService.updateProfile(user.id, {
                    customColor: customColor || undefined,
                    status
                })
            ]);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 p-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-brand-start" />
                        Manage User: {user.name || user.username}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* User Info Header */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                        <div className="h-12 w-12 rounded-full bg-slate-700 overflow-hidden ring-2 ring-slate-800 shadow-xl">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-brand-start/20 flex items-center justify-center text-brand-start font-bold">
                                    {(user.name || user.username).charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-white text-lg leading-tight">{user.name || user.username}</p>
                            <p className="text-xs text-slate-500 font-mono tracking-tight">{user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as User['status'])}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-start"
                            >
                                <option value="ACTIVE">✅ Active</option>
                                <option value="RESTRICTED">⚠️ Restricted</option>
                                <option value="BANNED">🚫 Banned</option>
                            </select>
                        </div>

                        {/* Custom Color Override */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custom Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={customColor || '#94a3b8'}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="h-9 w-12 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    placeholder="#HEX Override"
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none"
                                />
                                {customColor && (
                                    <button
                                        onClick={() => setCustomColor('')}
                                        className="text-xs text-red-400 hover:text-red-300 px-1"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assign Roles</label>
                        <div className="grid grid-cols-1 gap-2">
                            {allRoles.map((role) => {
                                const isActive = selectedRoles.includes(role.id);
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => handleToggleRole(role.id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border text-sm transition-all group",
                                            isActive
                                                ? "border-brand-start/50 bg-brand-start/10 text-white shadow-lg shadow-brand-start/5"
                                                : "border-slate-800 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-4 w-4 rounded-full shadow-sm ring-1 ring-white/10"
                                                style={{ backgroundColor: role.color }}
                                            />
                                            <span className={cn("font-medium transition-colors", isActive ? "text-white" : "text-slate-300 group-hover:text-white")}>
                                                {role.name}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-start/20 text-brand-start text-[10px] font-bold uppercase tracking-wider">
                                                Active
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/80 backdrop-blur-md rounded-b-xl">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-brand-start to-brand-end rounded-lg text-sm font-bold text-white hover:brightness-110 shadow-lg shadow-brand-end/20 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? 'Saving...' : 'Update Permissions'}
                    </button>
                </div>
            </div>
        </div>
    );
}
