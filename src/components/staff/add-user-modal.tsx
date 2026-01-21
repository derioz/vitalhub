'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { UserService } from '@/services/user-service';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        uid: '',
        username: '',
        email: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.uid || !formData.username) return;

        setLoading(true);
        try {
            await UserService.createUser(formData.uid, {
                username: formData.username,
                email: formData.email,
                avatarUrl: '',
                roles: ['role_vital_member'],
            });
            onSuccess();
            onClose();
            setFormData({ uid: '', username: '', email: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to add user. Check permissions.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-brand-start" />
                        Add New Member
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">User ID / UID</label>
                        <input
                            required
                            value={formData.uid}
                            onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                            placeholder="Paste Firebase UID"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-start transition-all"
                        />
                        <p className="text-[10px] text-slate-500 italic">This must match the user's account ID exactly.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Display Name</label>
                        <input
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-start transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="user@example.com"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-start transition-all"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-brand-start to-brand-end rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-end/20 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Adding...' : 'Confirm Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
