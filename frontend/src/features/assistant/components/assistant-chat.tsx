'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Check,
  Copy,
  Database,
  Loader2,
  RotateCcw,
  ScrollText,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAssistantChat, useAssistantStatus } from '@/hooks/use-assistant';
import { HttpClientError } from '@/services/http-client';
import type { AssistantChatResponse, AssistantSource } from '@/services/assistant';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

import { AssistantMarkdown } from './assistant-markdown';
import { errorMessage } from '../lib/chat-errors';
import { safeHref } from '../lib/citations';
import { groupSuggestions, SUGGESTED_QUESTIONS } from '../lib/suggested-questions';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: AssistantSource[];
  toolsUsed?: string[];
  insufficientEvidence?: boolean;
  error?: boolean;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `m${Date.now().toString(36)}-${idCounter}`;
}

function buildHistory(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter((message) => !message.error)
    .map((message) => ({ role: message.role, content: message.content }))
    .slice(-8);
}

type AssistantChatVariant = 'page' | 'floating';

interface AssistantChatProps {
  /** Heading rendered in the header. */
  title?: string;
  /** Subtitle under the heading; pass null to hide it (floating panel). */
  description?: ReactNode;
  /**
   * 'page' sizes to its content (the standalone /assistant page).
   * 'floating' fills the right-anchored chat panel.
   */
  variant?: AssistantChatVariant;
  /** Renders a close control in the header (used by the floating panel). */
  onClose?: () => void;
  /** Extra classes merged into the root card. */
  className?: string;
}

const DEFAULT_TITLE = 'SentinelAudit Assistant';
const DEFAULT_DESCRIPTION =
  'Read-only answers grounded in the project documentation and live audit data. It cannot change anything.';

export function AssistantChat({
  title = DEFAULT_TITLE,
  description,
  variant = 'page',
  onClose,
  className,
}: AssistantChatProps) {
  const isFloating = variant === 'floating';
  const subtitle = description !== undefined ? description : DEFAULT_DESCRIPTION;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const status = useAssistantStatus();
  const chat = useAssistantChat();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chat.isPending]);

  const send = useCallback(
    (question: string, appendUserMessage = true) => {
      const trimmed = question.trim();
      if (!trimmed || chat.isPending) return;

      const history = buildHistory(messagesRef.current);
      if (appendUserMessage) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'user', content: trimmed, createdAt: new Date().toISOString() },
        ]);
      }
      setInput('');
      setPendingQuestion(null);

      chat.mutate(
        { message: trimmed, history },
        {
          onSuccess: (response: AssistantChatResponse) => {
            setMessages((prev) => [
              ...prev,
              {
                id: nextId(),
                role: 'assistant',
                content: response.answer,
                sources: response.sources ?? [],
                toolsUsed: response.toolsUsed ?? [],
                insufficientEvidence: response.insufficientEvidence,
                createdAt: new Date().toISOString(),
              },
            ]);
          },
          onError: (error: unknown) => {
            setPendingQuestion(trimmed);
            setMessages((prev) => [
              ...prev,
              {
                id: nextId(),
                role: 'assistant',
                content: errorMessage(error),
                createdAt: new Date().toISOString(),
                error: true,
              },
            ]);
          },
        },
      );
    },
    [chat],
  );

  const retry = useCallback(() => {
    if (!pendingQuestion) return;
    // Drop the failed error bubble; the question itself stays in the transcript.
    setMessages((prev) => prev.filter((message, index) => !(message.error && index === prev.length - 1)));
    send(pendingQuestion, false);
  }, [pendingQuestion, send]);

  const reset = useCallback(() => {
    setMessages([]);
    setInput('');
    setPendingQuestion(null);
  }, []);

  const copyAnswer = useCallback(async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((current) => (current === message.id ? null : current)), 2000);
    } catch {
      // Clipboard may be unavailable; fail quietly rather than showing a false success.
    }
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  };

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden',
        isFloating && 'h-full rounded-none border-0 shadow-none',
        className,
      )}
    >
      <CardHeader
        className={cn(
          'flex-row items-start justify-between gap-4 space-y-0 border-b',
          isFloating && 'gap-3 px-4 py-3',
        )}
      >
        <div className="min-w-0 space-y-1">
          <CardTitle className={cn('flex items-center gap-2', isFloating && 'text-base')}>
            <Sparkles
              className={cn('shrink-0 text-primary', isFloating ? 'h-4 w-4' : 'h-5 w-5')}
              aria-hidden="true"
            />
            <span className="truncate">{title}</span>
          </CardTitle>
          {subtitle ? (
            <CardDescription className={isFloating ? 'text-xs' : undefined}>
              {subtitle}
            </CardDescription>
          ) : null}
          <AssistantStatusIndicator status={status} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isFloating ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              disabled={messages.length === 0}
              className="h-8 w-8"
              aria-label="New conversation"
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={messages.length === 0}
              className="shrink-0"
            >
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              New conversation
            </Button>
          )}
          {onClose ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              aria-label="Close assistant"
              title="Close assistant"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className={cn('flex flex-col gap-4 p-0', isFloating && 'min-h-0 flex-1')}>
        {status.data && !status.data.configured ? (
          <div className={cn('pt-4', isFloating ? 'px-4' : 'px-6')}>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>AI provider not configured</AlertTitle>
              <AlertDescription>
                No model provider is configured on this server, so questions cannot be answered yet.
                You can still browse the rest of the app.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          className={cn(
            'scrollbar-thin space-y-5 overflow-y-auto',
            isFloating
              ? 'min-h-0 flex-1 px-4 py-4'
              : 'min-h-[320px] max-h-[58vh] flex-1 px-6 py-4',
          )}
          role="log"
          aria-live="polite"
          aria-label="Assistant conversation"
        >
          {messages.length === 0 ? (
            <WelcomePanel onSelect={send} />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                copied={copiedId === message.id}
                onCopy={() => copyAnswer(message)}
              />
            ))
          )}

          {chat.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Searching documentation and live data…
            </div>
          ) : null}

          {pendingQuestion && !chat.isPending ? (
            <div>
              <Button variant="outline" size="sm" onClick={retry}>
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : null}
        </div>

        <div className={cn('shrink-0 border-t', isFloating ? 'px-4 py-3' : 'px-6 py-4')}>
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about assets, audit events, versions, or how SentinelAudit works…"
              aria-label="Ask the assistant"
              rows={2}
              maxLength={4000}
              disabled={chat.isPending}
              className="min-h-[44px] resize-none"
            />
            <Button
              onClick={() => send(input)}
              disabled={chat.isPending || input.trim().length === 0}
              aria-label="Send question"
            >
              {chat.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Press <kbd className="rounded border px-1">Enter</kbd> to send,{' '}
            <kbd className="rounded border px-1">Shift</kbd> +{' '}
            <kbd className="rounded border px-1">Enter</kbd> for a new line. Answers are read-only
            and cite their sources.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Honest readiness chip: it reflects the real `/api/assistant/status` response
 * (or its failure). It reports "Online" only when the backend says a provider
 * is configured — never optimistically.
 */
function AssistantStatusIndicator({
  status,
}: {
  status: ReturnType<typeof useAssistantStatus>;
}) {
  if (status.isPending) {
    return (
      <span className="flex items-center gap-1.5 text-2xs text-muted-foreground" role="status">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Checking assistant status…
      </span>
    );
  }

  if (status.isError) {
    const sessionExpired =
      status.error instanceof HttpClientError && status.error.statusCode === 401;
    return (
      <span className="flex items-center gap-1.5 text-2xs text-destructive" role="status">
        <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
        {sessionExpired ? 'Session expired' : 'Backend unavailable'}
      </span>
    );
  }

  const configured = status.data?.configured === true;

  return (
    <span className="flex items-center gap-1.5 text-2xs text-muted-foreground" role="status">
      <span
        className={cn('h-2 w-2 rounded-full', configured ? 'bg-success' : 'bg-warning')}
        aria-hidden="true"
      />
      {configured ? 'Online' : 'AI provider not configured'}
    </span>
  );
}

function WelcomePanel({ onSelect }: { onSelect: (question: string) => void }) {
  const groups = groupSuggestions(SUGGESTED_QUESTIONS);

  return (
    <div className="py-2">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">How can I help?</p>
          <p className="text-sm text-muted-foreground">
            I answer from SentinelAudit&apos;s documentation and the live audit data.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.category} className="space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.category}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.question)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {item.question}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  copied,
  onCopy,
}: {
  message: ChatMessage;
  copied: boolean;
  onCopy: () => void;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
          <p className="whitespace-pre-wrap">{message.content}</p>
          <p className="mt-1 text-right text-[10px] text-primary-foreground/70">
            {formatDateTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        {message.error ? (
          <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div
          className={cn(
            'rounded-2xl rounded-bl-sm border px-4 py-3',
            message.error ? 'border-destructive/40 bg-destructive/5' : 'bg-card',
          )}
        >
          {message.error ? (
            <p className="text-sm text-destructive">{message.content}</p>
          ) : (
            <AssistantMarkdown content={message.content} sources={message.sources ?? []} />
          )}
        </div>

        {message.insufficientEvidence && !message.error ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            The assistant could not find enough verified information for this question.
          </p>
        ) : null}

        {message.sources && message.sources.length > 0 ? (
          <SourceList sources={message.sources} />
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDateTime(message.createdAt)}</span>
          {!message.error ? (
            <>
              {message.toolsUsed && message.toolsUsed.length > 0 ? (
                <span className="flex flex-wrap items-center gap-1">
                  <span className="text-muted-foreground/70">Live data:</span>
                  {message.toolsUsed.map((tool) => (
                    <Badge key={tool} variant="secondary" className="font-normal">
                      {tool.replaceAll('_', ' ')}
                    </Badge>
                  ))}
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={onCopy}
                aria-label="Copy answer"
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3 w-3" aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" aria-hidden="true" /> Copy
                  </>
                )}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: AssistantSource[] }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Sources
      </p>
      <ul className="space-y-1.5">
        {sources.map((source, index) => (
          <li key={`${source.type}-${source.id}-${index}`} className="flex items-start gap-2 text-sm">
            <SourceIcon type={source.type} />
            <SourceLabel source={source} index={index + 1} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceIcon({ type }: { type: AssistantSource['type'] }) {
  if (type === 'document') return <BookOpen className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  if (type === 'asset') return <Database className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  return <ScrollText className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
}

function SourceLabel({ source, index }: { source: AssistantSource; index: number }) {
  const href = safeHref(source.href);
  const detail = source.section ? ` — ${source.section}` : '';
  const text = `${source.title}${detail}`;

  return (
    <span className="min-w-0">
      <span className="mr-1 font-medium text-foreground">[{index}]</span>
      {href ? (
        <Link href={href} className="text-primary underline underline-offset-2">
          {text}
        </Link>
      ) : (
        <span>{text}</span>
      )}
      <span className="ml-1 text-2xs uppercase tracking-wide text-muted-foreground">
        {source.type}
      </span>
    </span>
  );
}
