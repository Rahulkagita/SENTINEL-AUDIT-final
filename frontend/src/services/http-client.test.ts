import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClientError, httpClient } from '@/services/http-client';

/**
 * Error-handling contract for the shared fetch wrapper.
 *
 * The UI relies on HttpClientError carrying the HTTP status and the
 * server-provided message so it can show actionable errors (and redirect on
 * 401); a non-JSON error body must still surface the status instead of
 * crashing on response.json().
 */

function responseWith(status: number, body: unknown, ok = status < 400): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('httpClient error handling', () => {
  it('throws HttpClientError with the status and server message on JSON errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      responseWith(400, { message: 'page must be >= 0' }),
    ));

    await expect(httpClient.get('/assets')).rejects.toMatchObject({
      name: 'HttpClientError',
      statusCode: 400,
      message: 'page must be >= 0',
    });
  });

  it('preserves the 401 status so callers can redirect to login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      responseWith(401, { message: 'Authentication is required.' }),
    ));

    const error = await httpClient.get('/assets').catch((e) => e);
    expect(error).toBeInstanceOf(HttpClientError);
    expect((error as HttpClientError).statusCode).toBe(401);
    expect((error as HttpClientError).message).toBe('Authentication is required.');
  });

  it('still reports the status when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    } as unknown as Response));

    const error = await httpClient.get('/assets').catch((e) => e);
    expect(error).toBeInstanceOf(HttpClientError);
    expect((error as HttpClientError).statusCode).toBe(500);
    expect((error as HttpClientError).message).toBe('Request failed');
  });

  it('returns undefined for 204 No Content without parsing a body', async () => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json,
    } as unknown as Response));

    await expect(httpClient.delete('/assets/1')).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('attaches the stored bearer token when one exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue(responseWith(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'sentinel_audit_token' ? 'test-token' : null),
    });

    await httpClient.get('/assets');

    const [, init] = fetchMock.mock.calls.at(-1)!;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
  });
});
