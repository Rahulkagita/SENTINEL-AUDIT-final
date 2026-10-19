import { describe, expect, it } from 'vitest';
import { toApiListParams, toApiPage } from '@/lib/pagination';

/**
 * Regression tests for the pagination contract.
 *
 * Bug this guards: the UI sent its one-based page (page=1 = first visible
 * page) straight to the zero-based Spring Data backend, which returned the
 * SECOND page - empty - so a freshly created asset never showed up while
 * `total` claimed rows existed.
 */
describe('toApiPage', () => {
  it('maps the first UI page to backend page 0', () => {
    expect(toApiPage(1)).toBe(0);
  });

  it('maps subsequent UI pages to zero-based pages', () => {
    expect(toApiPage(2)).toBe(1);
    expect(toApiPage(3)).toBe(2);
    expect(toApiPage(10)).toBe(9);
  });

  it('never double-subtracts a value that is already zero-based', () => {
    expect(toApiPage(0)).toBe(0);
    expect(toApiPage(-1)).toBe(0);
  });

  it('passes through absent/invalid pages as undefined', () => {
    expect(toApiPage(undefined)).toBeUndefined();
    expect(toApiPage(null)).toBeUndefined();
    expect(toApiPage(Number.NaN)).toBeUndefined();
  });
});

describe('toApiListParams', () => {
  it('sends page=0 for the first visible page and keeps only allowed keys', () => {
    expect(toApiListParams({ page: 1, pageSize: 100 }, ['page', 'pageSize'])).toEqual({
      page: 0,
      pageSize: 100,
    });
  });

  it('drops unsupported pretend parameters (sort/order/filter objects)', () => {
    const params = {
      page: 1,
      pageSize: 10,
      search: 'invoice',
      sort: 'createdAt',
      order: 'desc',
      filter: { operation: 'CREATE' },
    };
    expect(toApiListParams(params, ['page', 'pageSize', 'search', 'operation'])).toEqual({
      page: 0,
      pageSize: 10,
      search: 'invoice',
    });
  });

  it('forwards the operation filter as a real string param', () => {
    expect(
      toApiListParams({ page: 1, pageSize: 30, operation: 'CREATE' }, [
        'page',
        'pageSize',
        'search',
        'operation',
      ]),
    ).toEqual({ page: 0, pageSize: 30, operation: 'CREATE' });
  });

  it('drops blank values so an empty search does not filter anything', () => {
    expect(
      toApiListParams({ page: 1, pageSize: 10, search: '  ', operation: undefined }, [
        'page',
        'pageSize',
        'search',
        'operation',
      ]),
    ).toEqual({ page: 0, pageSize: 10 });
  });

  it('returns undefined when there is nothing to send', () => {
    expect(toApiListParams(undefined, ['page', 'pageSize'])).toBeUndefined();
    expect(toApiListParams({}, ['page', 'pageSize'])).toBeUndefined();
  });
});
