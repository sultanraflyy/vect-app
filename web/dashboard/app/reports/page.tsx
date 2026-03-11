'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import ReportRow from '@/components/ReportRow';
import { supabase } from '@/lib/supabase';
import { VerificationReport } from '@/types/vect';
import { FileText, RefreshCw, Search } from 'lucide-react';

function ReportsContent() {
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped: VerificationReport[] = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title || 'Untitled',
        status: r.status,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        trustScore: r.trust_score || 0,
        verifiedCount: r.verified_count || 0,
        flaggedCount: r.flagged_count || 0,
        inputType: r.input_type || 'text',
        sourceUrl: r.source_url,
        fileName: r.file_name,
        creditsUsed: r.credits_used || 0,
        claims: r.claims || [],
      }));

      setReports(mapped);
    } catch (e) {
      console.error('Failed to fetch reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 animate-fade-up">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={fetchReports}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Link
          href="/verify"
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          New Verification
        </Link>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up"
        style={{ animationDelay: '100ms' }}
      >
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
                <div className="flex-1 h-4 bg-slate-100 rounded" />
                <div className="w-10 h-4 bg-slate-100 rounded" />
                <div className="hidden sm:block w-12 h-4 bg-slate-100 rounded" />
                <div className="hidden sm:block w-20 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {search ? 'No matching reports' : 'No reports yet'}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {search ? 'Try a different search' : 'Start a verification to see results here'}
            </p>
            {!search && (
              <Link
                href="/verify"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Verification
              </Link>
            )}
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">
              <span className="w-20 shrink-0">Status</span>
              <span className="flex-1">Title</span>
              <span className="w-12 shrink-0">Score</span>
              <span className="w-12 shrink-0">Type</span>
              <span className="hidden md:block w-16 shrink-0">Claims</span>
              <span className="w-24 shrink-0">Date</span>
              <span className="w-4" />
            </div>
            {filtered.map(report => (
              <ReportRow key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <DashboardLayout title="Reports">
        <ReportsContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
