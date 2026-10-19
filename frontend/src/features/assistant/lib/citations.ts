import type { AssistantSource } from '@/services/assistant';

/**
 * Turns a validated answer into renderable segments.
 *
 * The backend has already verified every citation and renumbered it to a
 * 1-based index into `sources`. This helper is the only place that interprets
 * those markers, so the UI never invents a reference: an out-of-range index is
 * rendered as literal text rather than a link.
 */

export interface TextSegment {
  kind: 'text';
  text: string;
}

export interface CitationSegment {
  kind: 'citation';
  /** 1-based index as shown to the user. */
  index: number;
  source: AssistantSource;
}

export type AnswerSegment = TextSegment | CitationSegment;

const CITATION_PATTERN = /\[(\d+)\]/g;

export function splitAnswerIntoSegments(
  answer: string,
  sources: AssistantSource[],
): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  if (!answer) return segments;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CITATION_PATTERN.lastIndex = 0;
  while ((match = CITATION_PATTERN.exec(answer)) !== null) {
    const index = Number(match[1]);
    const source = sources[index - 1];

    if (match.index > lastIndex) {
      segments.push({ kind: 'text', text: answer.slice(lastIndex, match.index) });
    }

    if (source) {
      segments.push({ kind: 'citation', index, source });
    } else {
      // Unknown/out-of-range marker: keep the raw text, never a dead link.
      segments.push({ kind: 'text', text: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < answer.length) {
    segments.push({ kind: 'text', text: answer.slice(lastIndex) });
  }

  return segments;
}

/** Only relative paths and http(s) URLs may become links. */
export function safeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const value = href.trim();
  if (value.startsWith('/')) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return null;
}
