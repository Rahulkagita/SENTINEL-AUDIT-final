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

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Entity, 'id' | 'createdAt' | 'lastChangedAt' | 'changeCount' | 'recordCount'>) =>
      AssetService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Entity> }) =>
      AssetService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entity(id) });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities });
    },
  });
}
