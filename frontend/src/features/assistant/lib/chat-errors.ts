import { HttpClientError } from '@/services/http-client';

/**
 * Maps an assistant chat failure to the message shown in the transcript.
 *
 * For 503s the backend distinguishes "not configured" (no provider key on
 * this server) from "temporarily unavailable" (provider outage). Its message
 * is a fixed, non-sensitive string, so we surface it — otherwise every
 * misconfiguration looks identical to a transient outage and the deploy
 * cannot be diagnosed from the UI. A generic fallback is used only when the
 * error body carried no message.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    if (error.statusCode === 401) return 'Your session has expired. Please sign in again.';
    if (error.statusCode === 503) {
      const serverMessage = error.message.trim();
      if (serverMessage.length > 0 && serverMessage !== 'Request failed') {
        return serverMessage;
      }
      return 'The assistant is unavailable right now — it may not be configured on this server. Please try again later.';
    }
    if (error.statusCode >= 500) {
      return 'The backend is unavailable right now. Please try again shortly.';
    }
    return error.message || 'Something went wrong. Please try again.';
  }
  // fetch() rejects with a TypeError when the backend cannot be reached at all.
  if (error instanceof TypeError) {
    return 'Could not reach the SentinelAudit backend. Please check that the server is running and try again.';
  }
  return 'Something went wrong. Please try again.';
}
