'use client';

import { useAuth } from '@/components/auth-provider';
import { Onboarding } from '@/components/portal/onboarding';
import { MemberPortal } from '@/components/portal/member-portal';
import { Loader2, Sparkles, LogIn, ChevronRight, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user, userData, loading, signInWithGoogle } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);

  // Artificial delay for smooth transition or wait for auth
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setPageLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center space-y-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#30363d]" />
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-[#8b949e] font-medium animate-pulse tracking-widest text-xs uppercase">Initializing Portal</p>
      </div>
    );
  }

  // State 1: Guest / Splash
  if (!user) {
    return <SplashView onLogin={signInWithGoogle} />;
  }

  // State 2: Onboarding
  if (user && userData && !userData.onboardingCompleted) {
    return (
      <main className="min-h-screen bg-[#0d1117]">
        <Onboarding
          userData={userData}
          onComplete={() => {
            // The AuthProvider snapshot will handle the re-render automatically
          }}
        />
      </main>
    );
  }

  // State 3: Member Portal
  return (
    <main className="min-h-screen bg-[#0d1117]">
      <MemberPortal />
    </main>
  );
}

function SplashView({ onLogin }: { onLogin: () => void }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await onLogin();
    } catch (err) {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1117] relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />

      <div className="z-10 max-w-4xl w-full text-center space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3 text-orange-500" />
            Official Server Hub
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
            VITAL<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">HUB</span>
          </h1>

          <p className="text-xl text-[#8b949e] max-w-2xl mx-auto leading-relaxed">
            The heartbeat of our community. Submit suggestions, file support tickets, and manage your identity in the world of Vital.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="group relative flex items-center gap-3 px-8 py-4 bg-white text-black font-bold text-lg rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            {isLoggingIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            <span>Join Vital Member</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="https://vitalrp.net"
            target="_blank"
            className="flex items-center gap-2 px-8 py-4 text-[#8b949e] font-bold hover:text-white transition-colors border border-transparent hover:border-[#30363d] rounded-xl"
          >
            <Globe className="h-5 w-5" />
            Main Website
          </a>
        </div>

        <div className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <FeatureCard
            title="Suggestions"
            desc="Have an idea for the city? Let our developers know directly."
          />
          <FeatureCard
            title="Support"
            desc="Stuck or need help? Our staff team is ready to assist you."
          />
          <FeatureCard
            title="Identity"
            desc="Customize how you appear in the community records."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[#484f58] text-xs font-mono flex items-center gap-4">
        <span>© 2026 VITAL ROLEPLAY</span>
        <span className="h-1 w-1 rounded-full bg-[#30363d]" />
        <span>SECURE ENCRYPTED ACCESS</span>
      </div>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-orange-500/30 transition-colors group">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        {title}
      </h3>
      <p className="text-sm text-[#8b949e] leading-relaxed group-hover:text-[#c9d1d9] transition-colors">
        {desc}
      </p>
    </div>
  );
}
