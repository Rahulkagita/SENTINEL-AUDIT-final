import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { invalidateAssetSideEffects } from '@/hooks/use-entities';
import { QUERY_KEYS } from '@/lib/constants';

/**
 * Mutation side-effect contract.
 *
 * Asset create/update/delete write audit records, so the affected views
 * (asset lists, audit timelines and audit logs) must be invalidated so they
 * refetch instead of showing stale data. Unrelated caches must be left alone.
 */
describe('invalidateAssetSideEffects', () => {
  it('invalidates entity, timeline and audit-log queries but nothing else', () => {
    const queryClient = new QueryClient();

    // Seed a few cached queries, including an unrelated dashboard one.
    queryClient.setQueryData([...QUERY_KEYS.entities, { page: 1 }], { data: [] });
    queryClient.setQueryData([...QUERY_KEYS.timelines, { assetId: '1' }], { data: [] });
    queryClient.setQueryData([...QUERY_KEYS.auditLogs, { page: 1 }], { data: [] });
    queryClient.setQueryData([...QUERY_KEYS.dashboard], { totalAssets: 0 });

    invalidateAssetSideEffects(queryClient);

    expect(queryClient.getQueryState([...QUERY_KEYS.entities, { page: 1 }])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState([...QUERY_KEYS.timelines, { assetId: '1' }])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState([...QUERY_KEYS.auditLogs, { page: 1 }])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState([...QUERY_KEYS.dashboard])?.isInvalidated).toBe(false);
  });
});
