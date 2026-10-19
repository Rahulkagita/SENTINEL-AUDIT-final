import { describe, expect, it } from 'vitest';

import type { AssistantSource } from '@/services/assistant';
import { safeHref, splitAnswerIntoSegments } from '@/features/assistant/lib/citations';

const sources: AssistantSource[] = [
  { type: 'document', id: 'assets#0', title: 'Assets', section: 'Fields', href: null },
  { type: 'asset', id: '7', title: 'Payroll', href: '/entities?search=7' },
];

describe('splitAnswerIntoSegments', () => {
  it('maps validated [n] markers to their sources', () => {
    const segments = splitAnswerIntoSegments('Tracked [1] and Payroll [2].', sources);

    expect(segments.map((segment) => segment.kind)).toEqual([
      'text',
      'citation',
      'text',
      'citation',
      'text',
    ]);
    const citations = segments.filter((segment) => segment.kind === 'citation');
    expect(citations).toHaveLength(2);
    if (citations[0].kind === 'citation') {
      expect(citations[0].index).toBe(1);
      expect(citations[0].source.title).toBe('Assets');
    }
    if (citations[1].kind === 'citation') {
      expect(citations[1].source.id).toBe('7');
    }
  });

  it('keeps an out-of-range marker as plain text instead of a dead link', () => {
    const segments = splitAnswerIntoSegments('See [5].', sources);

    expect(segments.some((segment) => segment.kind === 'citation')).toBe(false);
    const text = segments.map((segment) => (segment.kind === 'text' ? segment.text : '')).join('');
    expect(text).toBe('See [5].');
  });

  it('returns a single text segment when there are no markers', () => {
    expect(splitAnswerIntoSegments('Plain answer.', sources)).toEqual([
      { kind: 'text', text: 'Plain answer.' },
    ]);
  });

  it('handles an empty answer', () => {
    expect(splitAnswerIntoSegments('', sources)).toEqual([]);
  });
});

describe('safeHref', () => {
  it('allows relative paths and http(s) URLs', () => {
    expect(safeHref('/entities?search=7')).toBe('/entities?search=7');
    expect(safeHref('https://example.com/doc')).toBe('https://example.com/doc');
    expect(safeHref('http://example.com')).toBe('http://example.com');
  });

  it('rejects javascript:, data: and empty values', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>')).toBeNull();
    expect(safeHref('')).toBeNull();
    expect(safeHref(null)).toBeNull();
    expect(safeHref(undefined)).toBeNull();
  });
});
