'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetService } from '@/services/assets';
import { QUERY_KEYS } from '@/lib/constants';
import type { ApiListParams, Entity, PaginatedResponse } from '@/types';

export function useEntities(params?: ApiListParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.entities, params],
    queryFn: (): Promise<PaginatedResponse<Entity>> => AssetService.list(params),
  });
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.entity(id),
    queryFn: (): Promise<Entity> => AssetService.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Asset mutations (create/update/delete) write audit records, so they must
 * refresh every affected list: the asset lists themselves plus the Audit
 * Timeline and Audit Logs views, which would otherwise keep showing stale
 * (pre-creation) data until their own cache entry expired.
 *
 * Exported so the invalidation contract can be unit-tested against a real
 * QueryClient without rendering React.
 */
export function invalidateAssetSideEffects(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities, exact: false });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timelines, exact: false });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auditLogs, exact: false });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Entity, 'id' | 'createdAt' | 'lastChangedAt' | 'changeCount' | 'recordCount'>) =>
      AssetService.create(data),
    onSuccess: () => {
      invalidateAssetSideEffects(queryClient);
      // Refetch the asset lists that are currently on screen so the newly
      // created asset appears immediately, regardless of cache timing.
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.entities, type: 'active', exact: false });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Entity> }) =>
      AssetService.update(id, data),
    onSuccess: (_, { id }) => {
      invalidateAssetSideEffects(queryClient);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entity(id) });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssetService.delete(id),
    onSuccess: () => {
      invalidateAssetSideEffects(queryClient);
    },
  });
}
