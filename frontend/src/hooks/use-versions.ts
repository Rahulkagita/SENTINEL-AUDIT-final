'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VersionService } from '@/services/version';
import { QUERY_KEYS } from '@/lib/constants';
import type { ApiListParams } from '@/types';
import { toast } from 'sonner';

export function useVersions(assetId: string, params?: ApiListParams) {
  return useQuery({
    queryKey: ['versions', assetId, params],
    queryFn: () => VersionService.getVersionsByAssetId(assetId, params),
    enabled: Boolean(assetId),
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { assetId: string; versionName: string }) =>
      VersionService.restoreVersion(dto),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entities });
      queryClient.invalidateQueries({ queryKey: ['versions', variables.assetId] });
    },
  });
}
