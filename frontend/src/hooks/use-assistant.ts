import { useMutation, useQuery } from '@tanstack/react-query';

import { AssistantService, type AssistantChatRequest } from '@/services/assistant';
import { QUERY_KEYS, DEFAULT_QUERY_OPTIONS } from '@/lib/constants';

/**
 * Reads the assistant's readiness. Used to show a clear "not configured"
 * banner instead of failing silently.
 */
export function useAssistantStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.assistantStatus,
    queryFn: () => AssistantService.status(),
    ...DEFAULT_QUERY_OPTIONS,
    // The status rarely changes; no need to refetch aggressively.
    staleTime: 60 * 1000,
  });
}

/**
 * Sends a question to the backend. All grounding, retrieval and citation
 * validation happen server-side; the UI only renders what the API returns.
 */
export function useAssistantChat() {
  return useMutation({
    mutationFn: (payload: AssistantChatRequest) => AssistantService.chat(payload),
  });
}
