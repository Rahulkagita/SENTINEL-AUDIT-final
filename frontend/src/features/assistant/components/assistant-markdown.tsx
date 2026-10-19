'use client';

import Link from 'next/link';
import { Fragment, useMemo, type ReactNode } from 'react';

import type { AssistantSource } from '@/services/assistant';
import {
  safeHref,
  splitAnswerIntoSegments,
  type CitationSegment,
} from '@/features/assistant/lib/citations';
import { cn } from '@/lib/utils';

/**
 * Minimal, dependency-free markdown renderer for assistant answers.
 *
 * SECURITY: it never uses `dangerouslySetInnerHTML`, so any HTML in a model
 * answer is rendered as plain text. Links are restricted to relative paths and
 * http(s) URLs by `safeHref`. Citations are the validated `[n]` markers the
 * backend produced, linked only when the source carries a safe href.
 */

interface AssistantMarkdownProps {
  content: string;
  sources: AssistantSource[];
  className?: string;
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; text: string };

const INLINE_PATTERN =
  /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(\*([^*]+)\*)/g;

export function AssistantMarkdown({ content, sources, className }: AssistantMarkdownProps) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={cn('space-y-3 text-sm leading-relaxed', className)}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} sources={sources} blockKey={`b${index}`} />
      ))}
    </div>
  );
}

function BlockView({
  block,
  sources,
  blockKey,
}: {
  block: Block;
  sources: AssistantSource[];
  blockKey: string;
}) {
  switch (block.kind) {
    case 'heading': {
      const sizes = ['text-lg', 'text-base', 'text-sm', 'text-sm', 'text-sm', 'text-sm'];
      return (
        <p className={cn('font-semibold text-foreground', sizes[block.level - 1])}>
          {renderInline(block.text, sources, `${blockKey}-h`)}
        </p>
      );
    }
    case 'ul':
      return (
        <ul className="list-disc space-y-1 pl-5">
          {block.items.map((item, index) => (
            <li key={index}>{renderInline(item, sources, `${blockKey}-li${index}`)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="list-decimal space-y-1 pl-5">
          {block.items.map((item, index) => (
            <li key={index}>{renderInline(item, sources, `${blockKey}-li${index}`)}</li>
          ))}
        </ol>
      );
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
          <code className="font-mono">{block.text}</code>
        </pre>
      );
    default:
      return <p>{renderInline(block.text, sources, `${blockKey}-p`)}</p>;
  }
}

function renderInline(text: string, sources: AssistantSource[], keyPrefix: string): ReactNode[] {
  return splitAnswerIntoSegments(text, sources).map((segment, index) => {
    if (segment.kind === 'citation') {
      return <CitationBadge key={`${keyPrefix}-cite${index}`} segment={segment} />;
    }
    return (
      <Fragment key={`${keyPrefix}-text${index}`}>
        {renderInlineText(segment.text, `${keyPrefix}-${index}`)}
      </Fragment>
    );
  });
}

function renderInlineText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let count = 0;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-i${count}`;
    if (match[2] !== undefined) {
      nodes.push(<strong key={key} className="font-semibold">{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {match[4]}
        </code>,
      );
    } else if (match[6] !== undefined) {
      const href = safeHref(match[7]);
      if (href) {
        nodes.push(
          <Link key={key} href={href} className="text-primary underline underline-offset-2">
            {match[6]}
          </Link>,
        );
      } else {
        nodes.push(<Fragment key={key}>{match[6]}</Fragment>);
      }
    } else if (match[9] !== undefined) {
      nodes.push(<em key={key}>{match[9]}</em>);
    }

    lastIndex = INLINE_PATTERN.lastIndex;
    count += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function CitationBadge({ segment }: { segment: CitationSegment }) {
  const { source, index } = segment;
  const href = safeHref(source.href);
  const detail =
    source.type === 'document'
      ? `${source.title}${source.section ? ` — ${source.section}` : ''}`
      : source.title;
  const label = `Source ${index}: ${detail}`;

  const base =
    'mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary/10 px-1 align-super text-[10px] font-semibold leading-none text-primary';

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={cn(base, 'hover:bg-primary/20')}>
        {index}
      </Link>
    );
  }

  return (
    <span title={label} aria-label={label} className={cn(base, 'cursor-help')}>
      {index}
    </span>
  );
}

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = (markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  let index = 0;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ kind: 'code', text: code.join('\n') });
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, '').trim());
        index += 1;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, '').trim());
        index += 1;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }

  flushParagraph();
  return blocks;
}
