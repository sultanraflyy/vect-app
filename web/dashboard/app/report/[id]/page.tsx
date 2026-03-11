'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import TrustRing from '@/components/TrustRing';
import { supabase } from '@/lib/supabase';
import { VerificationReport, Claim } from '@/types/vect';
import {
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Share2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const claimStatusConfig = {
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    classes: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  flagged: {
    label: 'Flagged',
    icon: AlertTriangle,
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  unverifiable: {
    label: 'Unverifiable',
    icon: HelpCircle,
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
};

function ClaimCard({ claim }: { claim: Claim }) {
  const [expanded, setExpanded] = useState(false);
  const config = claimStatusConfig[claim.status] || claimStatusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden transition-all">
      <button
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${config.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 leading-snug">{claim.text}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            <span className="text-xs text-slate-400">
              {claim.confidence}% confidence
            </span>
          </div>
        </div>
        <div className="shrink-0 text-slate-400 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 space-y-3 mt-0 pt-3">
          {claim.explanation && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Explanation</p>
              <p className="text-sm text-slate-700">{claim.explanation}</p>
            </div>
          )}

          {claim.sources && claim.sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Sources</p>
              <div className="space-y-2">
                {claim.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate group-hover:text-blue-700">
                        {source.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{source.url}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {source.authorityScore}%
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportContent() {
  const params = useParams();
  const id = params?.id as string;
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setReport({
          id: data.id,
          title: data.title || 'Untitled',
          status: data.status,
          createdAt: data.created_at,
          completedAt: data.completed_at,
          trustScore: data.trust_score || 0,
          verifiedCount: data.verified_count || 0,
          flaggedCount: data.flagged_count || 0,
          inputType: data.input_type || 'text',
          sourceUrl: data.source_url,
          fileName: data.file_name,
          creditsUsed: data.credits_used || 0,
          claims: data.claims || [],
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-base font-medium text-slate-800 mb-1">Report not found</p>
        <p className="text-sm text-slate-500 mb-4">{error || 'This report does not exist or you don\'t have access.'}</p>
        <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Reports
        </Link>
      </div>
    );
  }

  const unverifiableCount = report.claims.filter(c => c.status === 'unverifiable').length;
  const date = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-5 animate-fade-up">
        <Link
          href="/reports"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Report header */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4 animate-fade-up"
        style={{ animationDelay: '50ms' }}
      >
        <div className="flex items-start gap-5">
          <TrustRing score={report.trustScore} size={72} strokeWidth={6} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 mb-1 leading-snug">{report.title}</h1>
            <p className="text-xs text-slate-500 mb-3">{date}</p>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                <CheckCircle className="w-3 h-3" />
                {report.verifiedCount} verified
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-200">
                <AlertTriangle className="w-3 h-3" />
                {report.flaggedCount} flagged
              </div>
              {unverifiableCount > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                  <HelpCircle className="w-3 h-3" />
                  {unverifiableCount} unverifiable
                </div>
              )}
              <div className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                {report.inputType.toUpperCase()}
              </div>
            </div>

            {report.sourceUrl && (
              <a
                href={report.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                {report.sourceUrl}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Claims */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up"
        style={{ animationDelay: '100ms' }}
      >
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Claims ({report.claims.length})
          </h2>
        </div>

        {report.claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No claims found in this report</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {report.claims.map((claim, i) => (
              <ClaimCard key={claim.id || i} claim={claim} />
            ))}
          </div>
        )}
      </div>

      {report.creditsUsed && (
        <p className="text-center text-xs text-slate-400 mt-4">
          {report.creditsUsed} credit{report.creditsUsed !== 1 ? 's' : ''} used
        </p>
      )}
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <AuthGuard>
      <DashboardLayout title="Report Detail" showNewVerification={true}>
        <ReportContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
