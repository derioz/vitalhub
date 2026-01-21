'use client';

import { useState } from 'react';
import { UserService } from '@/services/user-service';
import { useAuth } from '@/components/auth-provider';
import { User, Sparkles, ArrowRight, Palette, UserCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    userData: any;
    onComplete: () => void;
}

export function Onboarding({ userData, onComplete }: Props) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(userData?.name || userData?.username || '');
    const [color, setColor] = useState(userData?.customColor || '#f97316');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await UserService.updateProfile(userData.id, {
                name,
                customColor: color,
            });

            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await setDoc(doc(db, 'users', userData.id), {
                onboardingCompleted: true
            }, { merge: true });

            onComplete();
        } catch (err: any) {
            console.error(err);
            alert(`Failed to save profile: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-20 px-6 font-sans">
            <div className="text-center mb-10">
                <div className="inline-flex p-3 rounded-2xl bg-[#ea580c]/10 mb-4 animate-bounce">
                    <Sparkles className="h-8 w-8 text-[#ea580c]" />
                </div>
                <h1 className="text-4xl font-black text-white mb-2 leading-tight tracking-tight">Welcome to Vital!</h1>
                <p className="text-[#8b949e] max-w-sm mx-auto">Let's set up your profile identity before you access the hub.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6 bg-[#161b22] border border-[#30363d] p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                <div className="space-y-2 relative z-10">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#8b949e] uppercase tracking-wider px-1">
                        <UserCircle className="h-4 w-4" />
                        Display Name
                    </label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="What should we call you?"
                        className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-white text-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all placeholder:text-[#484f58]"
                    />
                </div>

                <div className="space-y-2 relative z-10">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#8b949e] uppercase tracking-wider px-1">
                        <Palette className="h-4 w-4" />
                        Signature Color
                    </label>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                        <div
                            className="h-14 w-14 rounded-xl shadow-lg ring-2 ring-[#30363d] flex items-center justify-center text-white font-black text-xl"
                            style={{ backgroundColor: color }}
                        >
                            {name.charAt(0)}
                        </div>
                        <div className="flex-1 space-y-1">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
                            />
                            <p className="text-[10px] text-[#8b949e]">Select a color that represents you.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 relative z-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group flex items-center justify-center gap-2 py-4 bg-white hover:bg-gray-100 rounded-xl text-black font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Setting up...</span>
                            </>
                        ) : (
                            <>
                                <span>Complete Setup</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
