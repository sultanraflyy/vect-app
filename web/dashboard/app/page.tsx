'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import MetricCard from '@/components/MetricCard';
import TrustRing from '@/components/TrustRing';
import ReportRow from '@/components/ReportRow';
import { supabase } from '@/lib/supabase';
import { getCreditsLeft, getTotalCredits } from '@/lib/credits';
import { VerificationReport } from '@/types/vect';
import { FileText, CheckCircle, AlertTriangle, Zap, RefreshCw } from 'lucide-react';

function DashboardContent() {
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [totalCredits, setTotalCredits] = useState(150);

  useEffect(() => {
    const initData = async () => {
      const left = await getCreditsLeft();
      const total = await getTotalCredits();
      setCreditsLeft(left);
      setTotalCredits(total);
      fetchReports();
    };
    initData();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

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

  const completedReports = reports.filter(r => r.status === 'completed');
  const avgTrustScore = completedReports.length
    ? Math.round(completedReports.reduce((sum, r) => sum + r.trustScore, 0) / completedReports.length)
    : 0;
  const totalVerified = reports.reduce((sum, r) => sum + (r.verifiedCount || 0), 0);
  const totalFlagged = reports.reduce((sum, r) => sum + (r.flaggedCount || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          title="Avg Trust Score"
          value={`${avgTrustScore}%`}
          subtitle="across completed reports"
          accent="blue"
          delay={50}
        >
          <TrustRing score={avgTrustScore} size={56} strokeWidth={5} />
        </MetricCard>

        <MetricCard
          title="Total Reports"
          value={reports.length}
          subtitle="all time"
          icon={<FileText className="w-4 h-4" />}
          accent="slate"
          delay={100}
        />

        <MetricCard
          title="Verified Claims"
          value={totalVerified}
          subtitle={`${totalFlagged} flagged`}
          icon={<CheckCircle className="w-4 h-4" />}
          accent="green"
          delay={150}
        />

        <MetricCard
          title="Credits Left"
          value={creditsLeft}
          subtitle={`of ${totalCredits} total`}
          icon={<Zap className="w-4 h-4" />}
          accent="amber"
          delay={200}
        />
      </div>

      {/* Recent Reports */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        style={{ animation: 'fadeUp 0.4s ease-out 0.25s forwards', opacity: 0 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Recent Reports</h2>
          <button
            onClick={fetchReports}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
                <div className="flex-1 h-4 bg-slate-100 rounded" />
                <div className="w-10 h-4 bg-slate-100 rounded" />
                <div className="hidden sm:block w-12 h-4 bg-slate-100 rounded" />
                <div className="hidden sm:block w-20 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No reports yet</p>
            <p className="text-xs text-slate-400 mb-4">Start a verification to see results here</p>
            <a
              href="/verify"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Verification
            </a>
          </div>
        ) : (
          <div>
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">
              <span className="w-20 shrink-0">Status</span>
              <span className="flex-1">Title</span>
              <span className="w-12 shrink-0">Score</span>
              <span className="w-12 shrink-0">Type</span>
              <span className="hidden md:block w-16 shrink-0">Claims</span>
              <span className="w-24 shrink-0">Date</span>
              <span className="w-4" />
            </div>
            {reports.map(report => (
              <ReportRow key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>

      {/* Flagged claims summary */}
      {totalFlagged > 0 && (
        <div
          className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
          style={{ animation: 'fadeUp 0.4s ease-out 0.35s forwards', opacity: 0 }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{totalFlagged} claims</span> flagged across your reports — review them for accuracy.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout title="Dashboard">
        <DashboardContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
