import { fetchWithTimeout } from './errorHandler';
import { supabase } from './supabase';

const BASE_URL = 'https://web-production-79c0c.up.railway.app';

// Typed sentinel for authentication failures so callers can instanceof-check
// rather than rely on fragile error-message string matching.
export class AuthenticationError extends Error {
  constructor(message = 'Not authenticated. Please log in again.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Cache the session access_token so it is always available when API calls fire.
// Supabase's async-storage initialization on React Native can mean getSession()
// returns null on the very first call even though a persisted session exists.
// Listening to onAuthStateChange (which fires on INITIAL_SESSION, SIGNED_IN,
// TOKEN_REFRESHED, and SIGNED_OUT) keeps this cache reliably up-to-date for
// the full lifetime of the app.
//
// NOTE: The subscription is intentionally not unsubscribed because
// verificationEngine is a module-level singleton that lives for the entire
// app lifetime.
let _accessToken: string | null = null;

supabase.auth.getSession()
  .then(({ data: { session } }) => {
    _accessToken = session?.access_token ?? null;
  })
  .catch(() => {
    // Initialization failure — the per-call fallback in getAuthHeaders will retry
  });

supabase.auth.onAuthStateChange((_event, session) => {
  _accessToken = session?.access_token ?? null;
});

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (_accessToken) {
    return { Authorization: `Bearer ${_accessToken}` };
  }
  // Fallback for the rare case the cache hasn't been populated yet
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    _accessToken = session.access_token;
    return { Authorization: `Bearer ${session.access_token}` };
  }
  throw new AuthenticationError();
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
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${BASE_URL}/api/fetch-url`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      },
      20000
    );
  } catch (e: any) {
    if (e.message === 'Request timed out') throw new Error('Request timed out');
    throw new Error('Network request failed');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch URL');
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
  let response: Response;
  try {
    const authHeaders = await getAuthHeaders();
    response = await fetchWithTimeout(
      `${BASE_URL}/api/scan`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ text, max_claims: maxClaims }),
      },
      30000
    );
  } catch (e: any) {
    if (e.message === 'Request timed out') throw new Error('Request timed out');
    throw new Error('Network request failed');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Scan failed');
  }

  const data = await response.json();
  // Expected backend shape:
  // {
  //   total_claims,
  //   grouped_claims,
  //   unique_claims,
  //   claims,
  //   preview?
  // }
  return data;
}

export async function processVerification(
  reportId: string,
  content: string,
  onProgress: (progress: number) => void,
  inputType: string = 'text',
  maxClaims: number = 50,
  prescannedClaims?: string[], // claims from scan to skip re-extraction
  skipBackendReport: boolean = true, // pass report_id to backend to avoid duplicate
): Promise<{ claims: any[]; creditsUsed: number }> {
  onProgress(10);
  let currentProgress = 10;
  const progressInterval = setInterval(() => {
    currentProgress = Math.min(currentProgress + 4, 85);
    onProgress(currentProgress);
  }, 1500);

  try {
    const authHeaders = await getAuthHeaders();
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${BASE_URL}/api/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            text: content,
            input_type: inputType,
            max_claims: maxClaims,
            claims: prescannedClaims ?? null,
            source_url: inputType === 'url' ? content : undefined,
            report_id: skipBackendReport ? reportId : null,
          }),
        },
        60000
      );
    } catch (e: any) {
      if (e.message === 'Request timed out') throw new Error('Request timed out');
      throw new Error('Network request failed');
    }

    clearInterval(progressInterval);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Verification failed');
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

export async function uploadFile(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${BASE_URL}/api/upload`,
      {
        method: 'POST',
        body: formData,
      },
      30000
    );
  } catch (e: any) {
    if (e.message === 'Request timed out') throw new Error('Request timed out');
    throw new Error('Network request failed');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.detail || '';
    if (msg.includes('size') || msg.includes('large')) throw new Error('File is too large. Max 2MB.');
    if (msg.includes('page')) throw new Error('Too many pages. Max 10 pages.');
    throw new Error('File upload failed');
  }

  const data = await response.json();
  return data.text;
}