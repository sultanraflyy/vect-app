import { supabase } from './supabase';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://web-production-79c0c.up.railway.app';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please log in again.');
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export function generateReportTitle(content: string, inputType: string): string {
  if (inputType === 'url') {
    try {
      const url = new URL(content);
      return `Verification: ${url.hostname}`;
    } catch {
      return 'URL Verification';
    }
  }
  if (inputType === 'pdf') {
    return content.replace(/\.[^/.]+$/, '') || 'Document Verification';
  }
  const words = content.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length > 0 ? `"${words}..."` : 'Text Verification';
}

export async function fetchUrlContent(url: string): Promise<string> {
  let authHeaders: Record<string, string> = {};
  try {
    authHeaders = await getAuthHeaders();
  } catch {
    // fetch-url endpoint doesn't require auth, proceed without
  }
  const response = await fetch(`${BASE_URL}/api/fetch-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any).detail || 'Failed to fetch URL');
  }
  const data = await response.json();
  return data.text;
}

export async function scanContent(
  text: string,
  maxClaims = 50
): Promise<{
  total_claims: number | string;
  grouped_claims: number | string;
  unique_claims: number | string;
  claims: any[];
  preview?: any[];
}> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ text, max_claims: maxClaims }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any).detail || 'Scan failed');
  }
  return response.json();
}

export async function processVerification(
  content: string,
  onProgress: (progress: number) => void,
  inputType = 'text',
  maxClaims = 50,
  prescannedClaims?: string[]
): Promise<{ claims: any[]; creditsUsed: number }> {
  onProgress(10);
  let currentProgress = 10;
  const progressInterval = setInterval(() => {
    currentProgress = Math.min(currentProgress + 4, 85);
    onProgress(currentProgress);
  }, 1500);

  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        text: content,
        input_type: inputType,
        max_claims: maxClaims,
        claims: prescannedClaims ?? null,
        source_url: inputType === 'url' ? content : undefined,
      }),
      signal: AbortSignal.timeout(90000),
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).detail || 'Verification failed');
    }

    const data = await response.json();
    onProgress(100);

    const claims = (data.claims || []).map((c: any) => ({
      id: c.id,
      text: c.text,
      status: c.status,
      confidence: c.confidence,
      category: 'general',
      explanation: c.explanation,
      sources: (c.sources || []).map((s: any) => ({
        title: s.title,
        url: s.url,
        authorityScore: Math.round((s.score || 0.5) * 100),
        snippet: s.snippet,
      })),
    }));

    return { claims, creditsUsed: data.credits_used };
  } catch (error) {
    clearInterval(progressInterval);
    onProgress(0);
    throw error;
  }
}

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  let authHeaders: Record<string, string> = {};
  try {
    authHeaders = await getAuthHeaders();
  } catch {
    // upload endpoint doesn't require auth, proceed without
  }

  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as any).detail || '';
    if (msg.includes('size') || msg.includes('large')) throw new Error('File is too large. Max 2MB.');
    if (msg.includes('page')) throw new Error('Too many pages. Max 10 pages.');
    throw new Error('File upload failed');
  }

  const data = await response.json();
  return data.text;
}

export async function fetchReports() {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/reports`, {
    headers: authHeaders,
  });
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

export async function fetchReport(id: string) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/reports/${id}`, {
    headers: authHeaders,
  });
  if (!response.ok) throw new Error('Failed to fetch report');
  return response.json();
}
