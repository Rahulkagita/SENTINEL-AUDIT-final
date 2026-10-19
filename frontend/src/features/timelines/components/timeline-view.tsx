'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare,
  Database,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useTimeline } from '@/hooks/use-timeline';
import { EmptyState } from '@/components/common/empty-state';
import { TableSkeleton } from '@/components/common/loading-skeletons';
import { OperationBadge } from '@/components/common/status-badges';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime, formatRelative, initials, getInitialsColor } from '@/lib/format';
import type { TimelineEvent } from '@/types';

// framer-motion list layout animations
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

const TIMELINE_PAGE_SIZE = 30;

export function TimelineView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtering and Search states. `search` is the raw input; the debounced
  // value is what actually hits GET /api/audit/timeline, where the backend
  // applies it server-side (unsupported params are never sent).
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [operation, setOperation] = useState<string>('all');
  const [page, setPage] = useState(1); // one-based UI page (service -> page=0 on the wire)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () => ({
      page,
      pageSize: TIMELINE_PAGE_SIZE,
      search: debouncedSearch || undefined,
      operation: operation !== 'all' ? operation : undefined,
    }),
    [page, debouncedSearch, operation],
  );

  // Dedicated timeline endpoint: zero-based pages, real search/operation
  // filters, newest-first CREATE/UPDATE/DELETE events.
  const { data, isLoading, isError, error, refetch } = useTimeline(query);

  const events: TimelineEvent[] = data?.data ?? [];
  const hasActiveFilters = Boolean(debouncedSearch) || operation !== 'all';

  // If the result set shrinks below the current page, snap back to the last
  // real page instead of showing a phantom empty page.
  const totalPages = data?.totalPages ?? 1;
  useEffect(() => {
    if (data && data.totalPages >= 1 && page > data.totalPages) {
      setPage(data.totalPages);
    }
  }, [data, page]);

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-full max-w-sm rounded bg-muted/20 animate-pulse" />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  // API errors are surfaced honestly instead of masquerading as an empty
  // timeline ("no events") - the distinction matters for an audit tool.
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-foreground">Failed to load the audit timeline</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'The timeline request could not be completed.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search timeline by entity, actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={operation} onValueChange={(v) => { setOperation(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="RESTORE">Restore</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state only when the (possibly filtered) result set is truly
          empty - `total` comes from the backend's filtered count. */}
      {events.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={hasActiveFilters ? 'No matching timeline events' : 'No timeline events yet'}
          description={
            hasActiveFilters
              ? 'The backend returned no events for the current search/action filters.'
              : 'Audit events will appear here once assets are created or changed.'
          }
        />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="relative pl-4 sm:pl-6 border-l border-border/80 ml-3 space-y-6">
          {events.map((event) => {
            const isExpanded = expandedId === event.id;

            return (
              <motion.div
                key={event.id}
                variants={item}
                className="relative group"
              >
                {/* Visual Timeline Timeline Dot */}
                <div
                  className={`absolute -left-[25px] sm:-left-[33px] top-4 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background transition-transform duration-200 group-hover:scale-110 ${
                    event.operation === 'CREATE'
                      ? 'bg-success'
                      : event.operation === 'DELETE'
                      ? 'bg-destructive'
                      : event.operation === 'UPDATE'
                      ? 'bg-primary'
                      : 'bg-accent'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-background" />
                </div>

                {/* Timeline Card */}
                <div
                  className={`rounded-xl border bg-card transition-all duration-200 ${
                    isExpanded
                      ? 'border-accent/40 shadow-elevated bg-card/65'
                      : 'border-border hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  {/* Collapsed Header trigger */}
                  <div
                    onClick={() => handleToggleExpand(event.id)}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 cursor-pointer gap-3 select-none"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <OperationBadge operation={event.operation} />

                      <div className="leading-tight">
                        <h4 className="text-sm font-bold text-foreground">{event.entityName}</h4>
                        <p className="mt-1 text-xs text-muted-foreground max-w-lg truncate">
                          {event.summary}
                        </p>
                      </div>
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex items-center gap-4 flex-wrap text-xs sm:self-end lg:self-center">
                      {/* Actor (real value from the audit record) */}
                      <span className="text-2xs text-muted-foreground whitespace-nowrap">
                        by {event.actor.name}
                      </span>

                      {/* Timestamp */}
                      <span className="text-2xs text-muted-foreground whitespace-nowrap">
                        {formatRelative(event.createdAt)}
                      </span>

                      {/* Collapse toggle icon */}
                      <div className="text-muted-foreground/60 group-hover:text-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Accordion Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          transition: { height: { duration: 0.25 }, opacity: { duration: 0.15, delay: 0.05 } },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: { height: { duration: 0.2 }, opacity: { duration: 0.1 } },
                        }}
                        className="overflow-hidden border-t border-border/60 bg-muted/5"
                      >
                        <div className="p-5 space-y-6 text-sm">
                          {/* Grid layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left: real event summary */}
                            <div className="lg:col-span-7 space-y-4">
                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Event Summary
                                </h5>
                                <div className="bg-background/40 border p-3 rounded-lg text-xs leading-relaxed text-foreground/80">
                                  {event.summary || 'No summary recorded for this event.'}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                  <Database className="h-3.5 w-3.5" />
                                  Record Reference
                                </h5>
                                <dl className="bg-background/40 border rounded-lg divide-y divide-border/60 text-xs">
                                  <div className="flex items-center justify-between px-3 py-2">
                                    <dt className="text-muted-foreground">Entity</dt>
                                    <dd className="font-mono text-foreground">{event.entityId || '—'}</dd>
                                  </div>
                                  <div className="flex items-center justify-between px-3 py-2">
                                    <dt className="text-muted-foreground">Audit record</dt>
                                    <dd className="font-mono text-foreground">{event.auditLogId || '—'}</dd>
                                  </div>
                                  <div className="flex items-center justify-between px-3 py-2">
                                    <dt className="text-muted-foreground">Operation</dt>
                                    <dd className="font-semibold text-foreground">{event.operation}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>

                            {/* Right: Actor & Timestamps */}
                            <div className="lg:col-span-5 space-y-4">
                              {/* Steward User */}
                              <div className="p-3.5 rounded-xl border bg-background/40 space-y-3">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Operation Steward
                                </h5>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={getInitialsColor(event.actor.name)}>
                                      {initials(event.actor.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="leading-tight">
                                    <p className="text-xs font-bold text-foreground">{event.actor.name}</p>
                                    <p className="text-3xs text-muted-foreground">
                                      {event.actor.role}
                                      {event.actor.email ? ` • ${event.actor.email}` : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Timestamps */}
                              <div className="p-3.5 rounded-xl border bg-background/40 space-y-3.5 text-xs">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Timing
                                </h5>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground text-2xs">
                                      <Clock className="h-3 w-3" /> Recorded at
                                    </span>
                                    <span className="text-foreground">{formatDateTime(event.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground text-2xs">
                                      <Clock className="h-3 w-3" /> Relative
                                    </span>
                                    <span className="font-semibold">{formatRelative(event.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Integrity note - stated honestly: no hash chain exists */}
                          <p className="p-3 bg-muted/40 border border-border/60 rounded-lg text-2xs text-muted-foreground">
                            No integrity hash is recorded for audit events — SentinelAudit does not
                            currently compute a hash chain, so no hash values are shown.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination footer (zero-based pages are requested; the UI shows 1-based) */}
      {events.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} &bull; {data?.total ?? events.length} events
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
