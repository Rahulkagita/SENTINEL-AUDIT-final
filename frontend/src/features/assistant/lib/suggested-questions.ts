/**
 * Suggested questions for the Assistant welcome screen.
 *
 * These are genuine prompts routed through the real RAG pipeline / live-data
 * tools — nothing here is a hardcoded answer. They deliberately span product
 * knowledge, live data, investigation, versions/dashboard and limitations so
 * the assistant's grounding and refusal behaviour is easy to explore.
 */

export type SuggestionCategory =
  | 'Product'
  | 'Live data'
  | 'Investigating changes'
  | 'Versions & dashboard'
  | 'Limitations';

export interface SuggestedQuestion {
  id: string;
  category: SuggestionCategory;
  question: string;
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'what-is',
    category: 'Product',
    question: 'What is SentinelAudit and what does it record?',
  },
  {
    id: 'audit-event-fields',
    category: 'Product',
    question: 'What information does an audit event contain?',
  },
  {
    id: 'count-assets',
    category: 'Live data',
    question: 'How many protected assets are there right now?',
  },
  {
    id: 'list-assets',
    category: 'Live data',
    question: 'List the protected assets currently tracked.',
  },
  {
    id: 'latest-changes',
    category: 'Investigating changes',
    question: 'What were the most recent changes to assets?',
  },
  {
    id: 'who-changed',
    category: 'Investigating changes',
    question: 'Who made the latest change and what did they change?',
  },
  {
    id: 'timeline',
    category: 'Investigating changes',
    question: 'Show me the change history for the most recently updated asset.',
  },
  {
    id: 'versions',
    category: 'Versions & dashboard',
    question: 'How does version history and restore work?',
  },
  {
    id: 'dashboard',
    category: 'Versions & dashboard',
    question: 'Summarize the current dashboard metrics.',
  },
  {
    id: 'limitations',
    category: 'Limitations',
    question: 'Can SentinelAudit tell me if a change was suspicious or tampered with?',
  },
  {
    id: 'no-anomaly',
    category: 'Limitations',
    question: 'Does it track IP addresses or detect anomalies?',
  },
];

/** Groups suggestions by category for display. */
export function groupSuggestions(
  suggestions: SuggestedQuestion[] = SUGGESTED_QUESTIONS,
): { category: SuggestionCategory; items: SuggestedQuestion[] }[] {
  const order: SuggestionCategory[] = [
    'Product',
    'Live data',
    'Investigating changes',
    'Versions & dashboard',
    'Limitations',
  ];
  return order
    .map((category) => ({
      category,
      items: suggestions.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
}
