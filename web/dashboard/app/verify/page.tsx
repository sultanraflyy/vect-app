'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Type,
  Link as LinkIcon,
  FileUp,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Upload,
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import {
  generateReportTitle,
  fetchUrlContent,
  scanContent,
  processVerification,
  uploadFile,
} from '@/lib/api';
import { useCredits, getCreditsLeft, hasEnoughCredits } from '@/lib/credits';
import { supabase } from '@/lib/supabase';

type InputMode = 'text' | 'url' | 'pdf';
type Step = 'input' | 'scanning' | 'confirm' | 'verifying' | 'done';

function VerifyContent() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('text');
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [maxClaims, setMaxClaims] = useState(50);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [creditsLeft, setCreditsLeft] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputType = mode;

  useEffect(() => {
    const fetchCredits = async () => {
      const left = await getCreditsLeft();
      setCreditsLeft(left);
    };
    fetchCredits();
  }, []);

  const getContent = () => {
    if (mode === 'text') return text;
    if (mode === 'url') return url;
    if (mode === 'pdf') return file?.name || '';
    return '';
  };

  const canScan = () => {
    if (mode === 'text') return text.trim().length >= 20;
    if (mode === 'url') return url.trim().length > 0;
    if (mode === 'pdf') return file !== null;
    return false;
  };

  const handleScan = async () => {
    setError('');
    setStep('scanning');
    try {
      let content = '';
      if (mode === 'url') {
        content = await fetchUrlContent(url);
      } else if (mode === 'pdf' && file) {
        content = await uploadFile(file);
      } else {
        content = text;
      }
      const result = await scanContent(content, 50);
      const uniqueCount = typeof result.unique_claims === 'number'
        ? result.unique_claims
        : (result.claims?.length || 0);
      const defaultMax = Math.min(uniqueCount, 50);
      setMaxClaims(Math.max(1, defaultMax));
      setScanResult({ ...result, resolvedContent: content });
      setStep('confirm');
    } catch (e: any) {
      setError(e.message || 'Scan failed');
      setStep('input');
    }
  };

  const handleVerify = async () => {
    const enough = await hasEnoughCredits(maxClaims);
    if (!enough) {
      setError(`Not enough credits. You need ${maxClaims} credits but only have ${creditsLeft}.`);
      return;
    }

    setStep('verifying');
    setProgress(0);
    setError('');

    try {
      const content = scanResult?.resolvedContent || getContent();
      const title = generateReportTitle(
        mode === 'pdf' ? (file?.name || '') : (mode === 'url' ? url : text),
        inputType
      );

      // Create Supabase report record
      const { data: { user } } = await supabase.auth.getUser();
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          title,
          input_text: content.slice(0, 5000),
          input_type: inputType,
          source_url: mode === 'url' ? url : undefined,
          file_name: mode === 'pdf' ? file?.name : undefined,
          status: 'processing',
          trust_score: 0,
          verified_count: 0,
          flagged_count: 0,
          claims: [],
          user_id: user?.id,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      const claimTexts = (scanResult?.claims || [])
        .slice(0, maxClaims)
        .map((c: any) => c.text || c);

      const { claims, creditsUsed } = await processVerification(
        content,
        setProgress,
        inputType,
        maxClaims,
        claimTexts.length > 0 ? claimTexts : undefined,
        reportData.id
      );

      const verified = claims.filter((c: any) => c.status === 'verified').length;
      const flagged = claims.filter((c: any) => c.status === 'flagged').length;
      const trustScore = Math.round((verified / Math.max(claims.length, 1)) * 100);

      await supabase
        .from('reports')
        .update({
          claims,
          status: 'completed',
          trust_score: trustScore,
          verified_count: verified,
          flagged_count: flagged,
          credits_used: creditsUsed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', reportData.id);

      // Deduct the actual credits used (per-claim from backend)
      await useCredits(creditsUsed);

      // Refresh local creditsLeft so UI reflects the deduction
      const updatedLeft = await getCreditsLeft();
      setCreditsLeft(updatedLeft);

      setStep('done');
      setTimeout(() => router.push(`/report/${reportData.id}`), 1500);
    } catch (e: any) {
      setError(e.message || 'Verification failed');
      setStep('confirm');
      setProgress(0);
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      if (dropped.size > 2 * 1024 * 1024) {
        setError('File too large. Max 2MB.');
        return;
      }
      setFile(dropped);
      setError('');
    } else {
      setError('Please upload a PDF file.');
    }
  }, []);

  const tabs: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'url', label: 'URL', icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'pdf', label: 'PDF', icon: <FileUp className="w-4 h-4" /> },
  ];

  // Confirm step computed values
  const totalClaims = typeof scanResult?.total_claims === 'number'
    ? scanResult.total_claims
    : (scanResult?.claims?.length || 0);
  const groupedClaims = typeof scanResult?.grouped_claims === 'number'
    ? scanResult.grouped_claims
    : totalClaims;
  const uniqueClaims = typeof scanResult?.unique_claims === 'number'
    ? scanResult.unique_claims
    : (scanResult?.claims?.length || 0);
  const sliderMax = Math.min(uniqueClaims, 50);
  const creditsRequired = maxClaims;
  const enoughForVerify = creditsLeft >= creditsRequired;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">New Verification</h2>
        <p className="text-sm text-slate-500">Submit content to verify claims with AI</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6 animate-fade-up">
        {['Input', 'Scan', 'Confirm', 'Verify'].map((s, i) => {
          const stepIndex = ['input', 'scanning', 'confirm', 'verifying'].indexOf(step);
          const done = i < stepIndex || step === 'done';
          const active = i === stepIndex || (step === 'done' && i === 3);
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                active ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  active ? 'bg-blue-100 text-blue-600' :
                  done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {done && !active ? <CheckCircle className="w-3 h-3" /> : i + 1}
                </div>
                {s}
              </div>
              {i < 3 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-up">

        {/* Input step */}
        {step === 'input' && (
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setMode(tab.id); setError(''); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    mode === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {mode === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste text to verify
                  </label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value.slice(0, 10000))}
                    rows={10}
                    placeholder="Paste an article, statement, or any text content you want to fact-check…"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-slate-400">{text.length.toLocaleString()} / 10,000 characters</span>
                    {text.length >= 10000 ? (
                      <span className="text-xs text-red-500">Character limit reached</span>
                    ) : text.length < 20 && text.length > 0 ? (
                      <span className="text-xs text-amber-600">Minimum 20 characters</span>
                    ) : null}
                  </div>
                </div>
              )}

              {mode === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Enter URL to verify
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">We'll fetch and verify the content from this URL</p>
                </div>
              )}

              {mode === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload PDF document
                  </label>
                  {file ? (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <FileUp className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">{file.name}</p>
                        <p className="text-xs text-blue-600">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="p-1 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-700 font-medium">Drop PDF here or click to upload</p>
                      <p className="text-xs text-slate-400 mt-1">Max 2MB • PDF only</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            if (f.size > 2 * 1024 * 1024) { setError('File too large. Max 2MB.'); return; }
                            setFile(f);
                            setError('');
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>{creditsLeft} credits available</span>
                </div>
                <button
                  onClick={handleScan}
                  disabled={!canScan()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Scan Claims
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanning step */}
        {step === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Scanning for claims…</h3>
            <p className="text-sm text-slate-500">Extracting and grouping factual claims from your content</p>
          </div>
        )}

        {/* Confirm step */}
        {step === 'confirm' && scanResult && (
          <div>
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900">Confirm Verification</h3>
              </div>
              <p className="text-sm text-slate-500">Review claims found and choose how many to verify</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
              {[
                { label: 'Total Claims', value: totalClaims },
                { label: 'After Grouping', value: groupedClaims },
                { label: 'Unique Claims', value: uniqueClaims },
              ].map((s) => (
                <div key={s.label} className="bg-white px-4 py-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Slider */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Claims to verify</label>
                <span className="text-sm font-bold text-blue-600">{maxClaims}</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(sliderMax, 1)}
                value={maxClaims}
                onChange={e => setMaxClaims(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span>
                <span>{Math.max(sliderMax, 1)}</span>
              </div>

              {/* Credits required */}
              <div className={`mt-4 flex items-center justify-between p-3 rounded-xl ${
                enoughForVerify ? 'bg-blue-50 border border-blue-100' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${enoughForVerify ? 'text-blue-600' : 'text-red-500'}`} />
                  <span className="text-sm font-medium text-slate-700">Credits required</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${enoughForVerify ? 'text-blue-600' : 'text-red-600'}`}>
                    {creditsRequired}
                  </span>
                  <span className="text-xs text-slate-400">of {creditsLeft} left</span>
                </div>
              </div>

              {!enoughForVerify && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Not enough credits. </span>
                  <Link href="/paywall" className="font-medium underline hover:text-red-700">
                    Upgrade plan →
                  </Link>
                </div>
              )}
            </div>

            {/* Claims preview */}
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
              {(scanResult.claims || []).slice(0, maxClaims).map((claim: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700">{claim.text || claim}</p>
                </div>
              ))}
              {(!scanResult.claims || scanResult.claims.length === 0) && (
                <div className="px-5 py-6 text-sm text-slate-500 text-center">No claims extracted</div>
              )}
            </div>

            {error && (
              <div className="mx-5 mb-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="p-5 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setStep('input')}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={!enoughForVerify || maxClaims < 1}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Verify Now
              </button>
            </div>
          </div>
        )}

        {/* Verifying step */}
        {step === 'verifying' && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Verifying claims…</h3>
              <p className="text-sm text-slate-500">This may take 30–60 seconds</p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-500">{progress}% complete</p>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Verification complete!</h3>
            <p className="text-sm text-slate-500">Redirecting to your report…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthGuard>
      <DashboardLayout title="New Verification" showNewVerification={false}>
        <VerifyContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
