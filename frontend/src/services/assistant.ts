import { httpClient } from './http-client';

/**
 * SentinelAudit Assistant API client.
 *
 * The assistant is read-only: this client only ever calls the chat/status/
 * reindex endpoints, and it sends no user identity — the backend derives the
 * acting user from the JWT that `httpClient` already attaches.
 */

export type AssistantSourceType = 'document' | 'asset' | 'event';

/** A verified source referenced by an answer. */
export interface AssistantSource {
  type: AssistantSourceType;
  /** Stable id: chunk key, asset id or audit-event id. */
  id: string;
  title: string;
  section?: string | null;
  /** In-app link to the referenced record/page, when available. */
  href?: string | null;
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  history: AssistantHistoryMessage[];
}

export interface AssistantChatResponse {
  answer: string;
  sources: AssistantSource[];
  toolsUsed: string[];
  provider: string;
  model: string;
  /** True when the assistant could not find enough verified information. */
  insufficientEvidence: boolean;
}

export interface AssistantStatus {
  configured: boolean;
  llmProvider: string;
  llmModel: string;
  embeddingProvider: string;
  embeddingModel: string;
  indexedChunks: number;
  indexedSources: string[];
  indexingEnabled: boolean;
  indexingOnStartup: boolean;
}

export interface ReindexResponse {
  sources: string[];
  embeddedChunks: number;
  skippedChunks: number;
  removedChunks: number;
  embeddingModel: string;
}

export const AssistantService = {
  /** POST /api/assistant/chat — ask a grounded, read-only question. */
  async chat(payload: AssistantChatRequest): Promise<AssistantChatResponse> {
    return httpClient.post<AssistantChatResponse>('/assistant/chat', payload);
  },

  /** GET /api/assistant/status — readiness snapshot (contains no secrets). */
  async status(): Promise<AssistantStatus> {
    return httpClient.get<AssistantStatus>('/assistant/status');
  },

  /** POST /api/assistant/reindex — idempotent re-index of approved docs. */
  async reindex(): Promise<ReindexResponse> {
    return httpClient.post<ReindexResponse>('/assistant/reindex');
  },
};
