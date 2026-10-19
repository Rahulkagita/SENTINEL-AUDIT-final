import { afterEach, describe, expect, it, vi } from 'vitest';

import { AssistantService } from '@/services/assistant';
import { HttpClientError } from '@/services/http-client';

/**
 * Contract tests for the Assistant API client.
 *
 * These lock the wire shape: the chat call must POST to /api/assistant/chat and
 * must not smuggle a user identity — the backend derives the actor from the JWT.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  const call = fetchMock.mock.calls.at(-1);
  expect(call, 'expected the service to have called fetch').toBeTruthy();
  return call as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AssistantService.chat', () => {
  it('POSTs the message and history to /api/assistant/chat', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        answer: 'There are 3 assets [1].',
        sources: [{ type: 'document', id: 'assets#0', title: 'Assets', section: null, href: null }],
        toolsUsed: ['list_assets'],
        provider: 'openai-compatible',
        model: 'gpt-4o-mini',
        insufficientEvidence: false,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await AssistantService.chat({
      message: 'How many assets?',
      history: [{ role: 'user', content: 'hello' }],
    });

    const [url, init] = lastCall(fetchMock);
    expect(new URL(String(url)).pathname).toBe('/api/assistant/chat');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      message: 'How many assets?',
      history: [{ role: 'user', content: 'hello' }],
    });
    expect(response.answer).toBe('There are 3 assets [1].');
    expect(response.sources).toHaveLength(1);
    expect(response.toolsUsed).toEqual(['list_assets']);
  });

  it('never sends a client-supplied user identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        answer: 'ok',
        sources: [],
        toolsUsed: [],
        provider: 'openai-compatible',
        model: 'm',
        insufficientEvidence: false,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await AssistantService.chat({ message: 'hi', history: [] });

    const [, init] = lastCall(fetchMock);
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['history', 'message']);
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('user');
  });

  it('surfaces a provider/unconfigured 503 as a typed HttpClientError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: false, message: 'The assistant is not configured on this server.' }, 503),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(AssistantService.chat({ message: 'hi', history: [] })).rejects.toBeInstanceOf(
      HttpClientError,
    );
    await expect(AssistantService.chat({ message: 'hi', history: [] })).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('surfaces a 400 for an invalid request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: false, message: 'message is required' }, 400),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(AssistantService.chat({ message: '', history: [] })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('AssistantService.status', () => {
  it('GETs /api/assistant/status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        configured: false,
        llmProvider: 'openai-compatible',
        llmModel: 'gpt-4o-mini',
        embeddingProvider: 'openai',
        embeddingModel: 'text-embedding-3-small',
        indexedChunks: 0,
        indexedSources: [],
        indexingEnabled: true,
        indexingOnStartup: false,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const status = await AssistantService.status();

    const [url, init] = lastCall(fetchMock);
    expect(new URL(String(url)).pathname).toBe('/api/assistant/status');
    expect((init ?? {}).method ?? 'GET').toBe('GET');
    expect(status.configured).toBe(false);
    expect(status.indexedChunks).toBe(0);
  });
});
