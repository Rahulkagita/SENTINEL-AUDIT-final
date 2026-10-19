import { describe, expect, it } from 'vitest';

import {
  SUGGESTED_QUESTIONS,
  groupSuggestions,
  type SuggestionCategory,
} from '@/features/assistant/lib/suggested-questions';

describe('suggested questions', () => {
  it('are real prompts that span every category', () => {
    const categories: SuggestionCategory[] = [
      'Product',
      'Live data',
      'Investigating changes',
      'Versions & dashboard',
      'Limitations',
    ];

    for (const category of categories) {
      expect(SUGGESTED_QUESTIONS.some((item) => item.category === category)).toBe(true);
    }
    expect(SUGGESTED_QUESTIONS.length).toBeGreaterThanOrEqual(8);
  });

  it('do not embed answers or citations (they must hit the real pipeline)', () => {
    for (const item of SUGGESTED_QUESTIONS) {
      expect(item.question.trim().length).toBeGreaterThan(8);
      // No pre-baked citation markers or quoted answers.
      expect(item.question).not.toMatch(/\[\d+\]/);
      expect(item.question.toLowerCase()).not.toContain("couldn't find enough verified");
    }
  });

  it('have unique ids and group without empty categories', () => {
    const ids = SUGGESTED_QUESTIONS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    const groups = groupSuggestions();
    expect(groups).toHaveLength(5);
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
    expect(groups.flatMap((group) => group.items)).toHaveLength(SUGGESTED_QUESTIONS.length);
  });
});
