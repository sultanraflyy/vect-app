import { fetchWithTimeout } from './errorHandler';

const BASE_URL = 'https://web-production-79c0c.up.railway.app';

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
    response = await fetchWithTimeout(`${BASE_URL}/api/fetch-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }, 20000);
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

export async function processVerification(
  reportId: string,
  content: string,
  onProgress: (progress: number) => void,
  inputType: string = 'text',
  maxClaims: number = 50,
): Promise<{ claims: any[]; creditsUsed: number }> {
  onProgress(10);
  let currentProgress = 10;
  const progressInterval = setInterval(() => {
    currentProgress = Math.min(currentProgress + 4, 85);
    onProgress(currentProgress);
  }, 1500);

  try {
    let textToVerify = content;
    if (inputType === 'url') {
      onProgress(20);
      textToVerify = await fetchUrlContent(content);
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(`${BASE_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToVerify,
          input_type: inputType,
            max_claims: maxClaims,
          source_url: inputType === 'url' ? content : undefined,
        }),
      }, 60000); // 60s for verification
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

    const claims = data.claims.map((c: any) => ({
      id: c.id,
      text: c.text,
      status: c.status,
      confidence: c.confidence,
      category: 'general',
      explanation: c.explanation,
      sources: c.sources?.map((s: any) => ({
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
    response = await fetchWithTimeout(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    }, 30000);
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
