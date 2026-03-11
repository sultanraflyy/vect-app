'use client';

import Link from 'next/link';
import { VerificationReport } from '@/types/vect';
import { CheckCircle, AlertTriangle, HelpCircle, Clock, ExternalLink } from 'lucide-react';

interface ReportRowProps {
  report: VerificationReport;
}

const statusConfig = {
  completed: { label: 'Verified', icon: CheckCircle, classes: 'bg-green-50 text-green-700 border-green-200' },
  failed: { label: 'Failed', icon: AlertTriangle, classes: 'bg-red-50 text-red-700 border-red-200' },
  pending: { label: 'Pending', icon: Clock, classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  processing: { label: 'Processing', icon: Clock, classes: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const inputTypeLabels: Record<string, string> = {
  text: 'Text',
  url: 'URL',
  pdf: 'PDF',
};

function trustScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export default function ReportRow({ report }: ReportRowProps) {
  const config = statusConfig[report.status] || statusConfig.pending;
  const Icon = config.icon;
  const date = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/report/${report.id}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0"
    >
      {/* Status badge */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.classes} shrink-0`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>

      {/* Title */}
      <span className="flex-1 text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
        {report.title}
      </span>

      {/* Trust score */}
      <span className={`text-sm font-semibold shrink-0 ${trustScoreColor(report.trustScore)}`}>
        {report.status === 'completed' ? `${report.trustScore}%` : '—'}
      </span>

      {/* Type */}
      <span className="hidden sm:block text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
        {inputTypeLabels[report.inputType] || 'Text'}
      </span>

      {/* Claims count */}
      <span className="hidden md:block text-xs text-slate-500 shrink-0">
        {report.claims?.length ?? 0} claims
      </span>

      {/* Date */}
      <span className="hidden sm:block text-xs text-slate-400 shrink-0">{date}</span>

      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
    </Link>
  );
}
