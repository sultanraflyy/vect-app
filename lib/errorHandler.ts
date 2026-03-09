import { Alert } from 'react-native';

export type AppError =
  | 'no_internet'
  | 'backend_down'
  | 'timeout'
  | 'url_fetch_failed'
  | 'upload_failed'
  | 'file_too_large'
  | 'verification_failed'
  | 'auth_failed'
  | 'unknown';

export function parseError(error: any): { type: AppError; message: string } {
  const msg = error?.message?.toLowerCase() ?? '';

  if (msg.includes('network request failed') || msg.includes('fetch') && msg.includes('failed')) {
    return { type: 'no_internet', message: 'No internet connection. Please check your network and try again.' };
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return { type: 'timeout', message: 'Request timed out. The server may be busy — please try again.' };
  }
  if (msg.includes('502') || msg.includes('503') || msg.includes('504') || msg.includes('backend')) {
    return { type: 'backend_down', message: 'Our servers are temporarily unavailable. Please try again in a moment.' };
  }
  if (msg.includes('file') && msg.includes('large')) {
    return { type: 'file_too_large', message: 'File is too large. Maximum size is 2MB.' };
  }
  if (msg.includes('upload')) {
    return { type: 'upload_failed', message: 'File upload failed. Please try again.' };
  }
  if (msg.includes('fetch url') || msg.includes('url')) {
    return { type: 'url_fetch_failed', message: 'Could not fetch content from this URL. The site may be blocking access.' };
  }
  if (msg.includes('verification')) {
    return { type: 'verification_failed', message: 'Verification failed. Please try again.' };
  }

  return { type: 'unknown', message: error?.message || 'Something went wrong. Please try again.' };
}

export function showError(error: any, title = 'Error') {
  const { message } = parseError(error);
  Alert.alert(title, message, [{ text: 'OK' }]);
}

export function getErrorEmoji(type: AppError): string {
  switch (type) {
    case 'no_internet': return '📵';
    case 'backend_down': return '🔧';
    case 'timeout': return '⏱️';
    case 'url_fetch_failed': return '🔗';
    case 'upload_failed': return '📎';
    case 'file_too_large': return '📦';
    default: return '⚠️';
  }
}

// Wrap fetch with timeout
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Request timed out');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
