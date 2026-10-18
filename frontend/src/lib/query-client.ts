import { QueryClient } from '@tanstack/react-query';
import { DEFAULT_QUERY_OPTIONS } from '@/lib/constants';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: DEFAULT_QUERY_OPTIONS,
      mutations: {
        retry: 0,
      },
    },
  });
}
