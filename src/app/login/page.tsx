'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !loading) {
            router.push('/');
        }
    }, [user, loading, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-sm space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
                        Team Panel
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Vital RP Operations
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <button
                        onClick={() => signInWithGoogle()}
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-brand-start to-brand-end px-4 py-3 text-sm font-medium text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand-start focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? 'Initializing...' : 'Sign in with Google'}
                    </button>
                </div>
            </div>
        </div>
    );
}
