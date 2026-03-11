'use client';

import Link from 'next/link';
import { Filter, Plus, Menu } from 'lucide-react';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  showNewVerification?: boolean;
}

export default function Topbar({ title, onMenuClick, showNewVerification = true }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="flex-1 text-base font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>

        {showNewVerification && (
          <Link
            href="/verify"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Verification</span>
            <span className="sm:hidden">New</span>
          </Link>
        )}
      </div>
    </header>
  );
}
