'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { getCreditsLeft, getTotalCredits } from '@/lib/credits';
import {
  Zap,
  ChevronRight,
  Bell,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
} from 'lucide-react';

function ProfileContent() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ reports: 0, claims: 0 });
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [totalCredits, setTotalCredits] = useState(150); 
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchCredits = async () => {
      const left = await getCreditsLeft();
      const total = await getTotalCredits();
      setCreditsLeft(left);
      setTotalCredits(total);
    };

    fetchCredits();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      const { data: reports } = await supabase
        .from('reports')
        .select('id, claims')
        .eq('status', 'completed');

      const totalReports = reports?.length || 0;
      const totalClaims = (reports || []).reduce(
        (sum: number, r: any) => sum + (Array.isArray(r.claims) ? r.claims.length : 0),
        0
      );
      setStats({ reports: totalReports, claims: totalClaims });
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const initial = userEmail ? userEmail[0].toUpperCase() : 'U';
  const creditsPercent = totalCredits > 0 ? Math.round((creditsLeft / totalCredits) * 100) : 0;

  const menuItems = [
    { label: 'Notifications', icon: Bell, action: () => showToast('Coming Soon') },
    { label: 'Privacy & Security', icon: Shield, action: () => showToast('Coming Soon') },
    { label: 'My Reports', icon: FileText, action: () => router.push('/') },
    { label: 'Help & Support', icon: HelpCircle, action: () => showToast('Coming Soon') },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-up">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4 flex items-center gap-4 animate-fade-up">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
          <span className="text-white text-xl font-bold">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-slate-900 truncate">{userEmail || 'User'}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Free Plan
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-up">
        {[
          { label: 'Reports', value: loading ? '—' : stats.reports },
          { label: 'Total Claims', value: loading ? '—' : stats.claims },
          { label: 'Credits Left', value: creditsLeft },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/paywall"
        className="flex items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-4 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm animate-fade-up"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Upgrade to Pro</p>
          <p className="text-xs text-blue-200 mt-0.5">1,500 verifications/month · $14.99</p>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-300 shrink-0" />
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Free Credits</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {creditsLeft} / {totalCredits}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${creditsPercent}%`,
              backgroundColor: creditsPercent > 50 ? '#2563eb' : creditsPercent > 20 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
        <p className="text-xs text-slate-400">150 standard credits/month on Free plan</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4 animate-fade-up">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Settings</p>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
          >
            <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="flex-1 text-sm text-slate-700 text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        ))}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 hover:text-red-600 transition-colors animate-fade-up"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </button>

      <p className="text-center text-xs text-slate-400 mt-4 animate-fade-up">
        Vect v1.0.0 · Truth Infrastructure
      </p>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <DashboardLayout title="Profile">
        <ProfileContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
