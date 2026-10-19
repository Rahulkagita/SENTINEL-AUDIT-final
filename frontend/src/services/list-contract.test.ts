import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetService } from '@/services/assets';
import { AuditService } from '@/services/audit';
import type { PaginatedResponse, TimelineEvent } from '@/types';

/**
 * Contract tests: what the service layer actually puts on the wire.
 *
 * Guards against both original bugs:
 * 1. the first visible UI page must request backend page=0 (zero-based);
 * 2. the timeline must call GET /api/audit/timeline with REAL filter params
 *    (search/operation) instead of the unsupported `filter={operation}`
 *    object the backend ignored.
 */

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

function lastRequestUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
  const call = fetchMock.mock.calls.at(-1);
  expect(call, 'expected the service to have called fetch').toBeTruthy();
  return new URL(String(call![0]));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AssetService.list pagination contract', () => {
  it('requests page=0 for the first visible page (page: 1)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: [], total: 0, page: 0, pageSize: 100, totalPages: 0,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await AssetService.list({ page: 1, pageSize: 100 });

    const url = lastRequestUrl(fetchMock);
    expect(url.pathname).toBe('/api/assets');
    expect(url.searchParams.get('page')).toBe('0');
    expect(url.searchParams.get('pageSize')).toBe('100');
  });

  it('forwards the supported server-side filters and drops unsupported ones', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: [], total: 0, page: 0, pageSize: 10, totalPages: 0,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await AssetService.list({
      page: 2,
      pageSize: 10,
      search: 'invoice',
      department: 'finance',
      status: 'connected',
      risk: 'high',
      sort: 'createdAt',
      order: 'desc',
      operation: 'CREATE',
    });

    const url = lastRequestUrl(fetchMock);
    expect(url.searchParams.get('page')).toBe('1'); // UI page 2 -> API page 1
    expect(url.searchParams.get('search')).toBe('invoice');
    expect(url.searchParams.get('department')).toBe('finance');
    expect(url.searchParams.get('status')).toBe('connected');
    expect(url.searchParams.get('risk')).toBe('high');
    // These are still not understood by GET /api/assets.
    expect(url.searchParams.has('sort')).toBe(false);
    expect(url.searchParams.has('order')).toBe(false);
    expect(url.searchParams.has('operation')).toBe(false);
  });
});

describe('AuditService pagination and filter contract', () => {
  it('listLogs sends a zero-based page with real search/operation filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: [], total: 0, page: 0, pageSize: 10, totalPages: 0,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await AuditService.listLogs({
      page: 1,
      pageSize: 10,
      search: 'invoice',
      operation: 'CREATE',
      sort: 'createdAt', // unsupported -> must not be sent
      order: 'desc', // unsupported -> must not be sent
    });

    const url = lastRequestUrl(fetchMock);
    expect(url.pathname).toBe('/api/audit/logs');
    expect(url.searchParams.get('page')).toBe('0');
    expect(url.searchParams.get('pageSize')).toBe('10');
    expect(url.searchParams.get('search')).toBe('invoice');
    expect(url.searchParams.get('operation')).toBe('CREATE');
    expect(url.searchParams.has('sort')).toBe(false);
    expect(url.searchParams.has('order')).toBe(false);
  });

  it('listTimeline calls the dedicated /api/audit/timeline endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: [], total: 0, page: 0, pageSize: 30, totalPages: 0,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await AuditService.listTimeline({ page: 1, pageSize: 30, operation: 'CREATE' });

    const url = lastRequestUrl(fetchMock);
    expect(url.pathname).toBe('/api/audit/timeline');
    expect(url.searchParams.get('page')).toBe('0');
    expect(url.searchParams.get('operation')).toBe('CREATE');
    // The old buggy request shape must never come back.
    expect(url.searchParams.has('filter')).toBe(false);
  });

  it('passes the assetId scope through to the timeline endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: [], total: 0, page: 0, pageSize: 30, totalPages: 0,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await AuditService.listTimeline({ page: 1, pageSize: 30, assetId: '42' });

    const url = lastRequestUrl(fetchMock);
    expect(url.searchParams.get('assetId')).toBe('42');
    expect(url.searchParams.get('page')).toBe('0');
  });
});

describe('Timeline response mapping (TimelineResponseDto contract)', () => {
  /** A payload exactly as GET /api/audit/timeline returns it. */
  const backendPayload = {
    data: [
      {
        id: '7',
        auditLogId: '7',
        entityId: '12',
        entityName: 'Java Timeline Asset',
        operation: 'CREATE',
        actor: {
          id: 'u-7',
          name: 'repro@example.com',
          email: 'repro@example.com',
          role: 'USER',
          avatarUrl: null,
        },
        summary: 'Asset created',
        fieldCount: 0,
        hash: '',
        previousHash: '',
        createdAt: '2026-10-19T10:30',
      },
      {
        id: '8',
        auditLogId: '8',
        entityId: '12',
        entityName: 'Java Timeline Asset',
        operation: 'UPDATE',
        actor: {
          id: 'u-8',
          name: 'repro@example.com',
          email: 'repro@example.com',
          role: 'USER',
          avatarUrl: null,
        },
        summary: 'Asset updated successfully',
        fieldCount: 0,
        hash: '',
        previousHash: '',
        createdAt: '2026-10-19T12:00',
      },
    ],
    total: 2,
    page: 0,
    pageSize: 30,
    totalPages: 1,
  };

  it('parses data/total/page/pageSize/totalPages and the event fields the UI renders', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(backendPayload));
    vi.stubGlobal('fetch', fetchMock);

    const result: PaginatedResponse<TimelineEvent> = await AuditService.listTimeline({
      page: 1,
      pageSize: 30,
    });

    // Envelope
    expect(result.total).toBe(2);
    expect(result.page).toBe(0);
    expect(result.pageSize).toBe(30);
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(2);

    // Event fields the timeline UI depends on
    const [first, second] = result.data;
    expect(first.id).toBe('7');
    expect(first.auditLogId).toBe('7');
    expect(first.entityId).toBe('12');
    expect(first.entityName).toBe('Java Timeline Asset');
    expect(first.operation).toBe('CREATE');
    expect(first.actor.name).toBe('repro@example.com');
    expect(first.summary).toBe('Asset created');
    expect(first.fieldCount).toBe(0);
    expect(first.createdAt).toBe('2026-10-19T10:30');
    expect(second.operation).toBe('UPDATE');
    expect(second.createdAt).toBe('2026-10-19T12:00');
  });

  it('never invents hash values - empty strings pass through as empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(backendPayload));
    vi.stubGlobal('fetch', fetchMock);

    const result = await AuditService.listTimeline({ page: 1, pageSize: 30 });

    for (const event of result.data) {
      expect(event.hash).toBe('');
      expect(event.previousHash).toBe('');
    }
  });
});
