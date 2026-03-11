'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Key,
  CreditCard,
  LogOut,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCreditsLeft, getTotalCredits } from '@/lib/credits';
import { useEffect, useState } from 'react';

interface SidebarProps {
  userEmail?: string;
  onClose?: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/verify', label: 'Verify', icon: ShieldCheck },
];

const settingsItems = [
  { href: '/api-keys', label: 'API Keys', icon: Key },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

export default function Sidebar({ userEmail, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [creditsLeft, setCreditsLeft] = useState(0);
  const totalCredits = getTotalCredits();

  useEffect(() => {
    setCreditsLeft(getCreditsLeft());
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const initial = userEmail ? userEmail[0].toUpperCase() : 'U';
  const creditsPercent = Math.round((creditsLeft / totalCredits) * 100);

  return (
    <aside className="flex flex-col w-full h-full bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm font-mono">V</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-slate-900">Vect</span>
          <span className="text-xs text-slate-400">Workspace</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Menu</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-400" />}
            </Link>
          );
        })}

        <p className="px-3 py-1.5 mt-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Settings</p>
        {settingsItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Credits block */}
      <div className="px-3 pb-3 shrink-0">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-slate-700">Credits Remaining</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-lg font-bold text-slate-900">{creditsLeft}</span>
            <span className="text-xs text-slate-400">/ {totalCredits}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${creditsPercent}%`,
                backgroundColor: creditsPercent > 50 ? '#2563eb' : creditsPercent > 20 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
        </div>
      </div>

      {/* User block */}
      <div className="px-3 pb-4 shrink-0 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{userEmail || 'User'}</p>
            <p className="text-xs text-slate-400">Starter plan</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
