import { describe, expect, it } from 'vitest';

import { errorMessage } from '@/features/assistant/lib/chat-errors';
import { HttpClientError } from '@/services/http-client';

/**
 * Regression tests for assistant chat error rendering.
 *
 * The bug: every 503 was replaced with the generic "may not be configured"
 * wording, so the backend's distinct, safe messages ("not configured" vs
 * "temporarily unavailable") were never visible and an unconfigured deploy
 * looked identical to a transient outage.
 */
function httpError(statusCode: number, message: string): HttpClientError {
  return new HttpClientError({ message }, statusCode);
}

describe('errorMessage', () => {
  it('surfaces the backend 503 "not configured" message verbatim', () => {
    const error = httpError(503, 'The assistant is not configured on this server.');
    expect(errorMessage(error)).toBe('The assistant is not configured on this server.');
  });

  it('surfaces the backend 503 "temporarily unavailable" message verbatim', () => {
    const error = httpError(503, 'The assistant is temporarily unavailable. Please try again.');
    expect(errorMessage(error)).toBe('The assistant is temporarily unavailable. Please try again.');
  });

  it('falls back to the generic 503 message when the body carried none', () => {
    expect(errorMessage(httpError(503, 'Request failed'))).toBe(
      'The assistant is unavailable right now — it may not be configured on this server. Please try again later.',
    );
    expect(errorMessage(httpError(503, '   '))).toBe(
      'The assistant is unavailable right now — it may not be configured on this server. Please try again later.',
    );
  });

  it('keeps the 401 session-expired message', () => {
    expect(errorMessage(httpError(401, 'JWT is invalid or expired'))).toBe(
      'Your session has expired. Please sign in again.',
    );
  });

  it('keeps the generic 5xx message', () => {
    expect(errorMessage(httpError(500, 'Unexpected server error'))).toBe(
      'The backend is unavailable right now. Please try again shortly.',
    );
  });

  it('keeps the client-facing message for 4xx errors', () => {
    expect(errorMessage(httpError(400, 'message is required'))).toBe('message is required');
  });

  it('explains an unreachable backend (fetch TypeError)', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe(
      'Could not reach the SentinelAudit backend. Please check that the server is running and try again.',
    );
  });

  it('never leaks anything for unknown errors', () => {
    expect(errorMessage(new Error('ECONNREFUSED 127.0.0.1:5432 password=hunter2'))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
