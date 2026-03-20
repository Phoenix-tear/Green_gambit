'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30 transform hover:scale-105 transition-transform">
            <span className="text-[#0d2818] font-black text-3xl">G</span>
          </div>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
            The Green
          </span>
          <br />
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            Gambit
          </span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Experience the thrill of real-time bidding. Compete with others, place your bets, and win exclusive items.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-[#0d2818] px-8 py-4 rounded-xl text-lg font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:-translate-y-0.5"
          >
            Start Bidding →
          </Link>
          <Link
            href="/login"
            className="border border-[#1a4731] text-gray-300 px-8 py-4 rounded-xl text-lg font-medium hover:border-emerald-500/50 hover:text-emerald-400 transition-all hover:bg-emerald-500/5"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="mt-16 flex flex-wrap gap-4 justify-center">
          {[
            { icon: '⚡', text: 'Real-Time Bids' },
            { icon: '🔒', text: 'Secure Auth' },
            { icon: '🏆', text: 'Live Auctions' },
            { icon: '👥', text: 'Multi-User' },
          ].map((feature) => (
            <div
              key={feature.text}
              className="flex items-center gap-2 bg-[#0d2818]/80 border border-[#1a4731]/60 px-4 py-2 rounded-full text-sm"
            >
              <span>{feature.icon}</span>
              <span className="text-gray-300">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
