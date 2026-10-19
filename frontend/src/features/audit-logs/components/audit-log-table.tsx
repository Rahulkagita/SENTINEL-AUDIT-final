'use client';

import { motion } from 'framer-motion';
import { ScrollText, Search } from 'lucide-react';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OperationBadge, SeverityBadge, AuditStatusBadge } from '@/components/common/status-badges';
import { EmptyState } from '@/components/common/empty-state';
import { TableSkeleton } from '@/components/common/loading-skeletons';
import { AuditLogDetailDrawer } from '@/features/audit-logs/components/audit-log-detail-drawer';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { AuditLogEntry } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const row = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function AuditLogTable() {
  const [page, setPage] = useState(1); // one-based UI page (service -> zero-based on the wire)
  const [search, setSearch] = useState('');
  const [operation, setOperation] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // GET /api/audit/logs applies search/operation server-side (real params);
  // sort/order/filter objects are not supported and are never sent.
  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page,
    pageSize: 10,
    search: search.trim() || undefined,
    operation: operation !== 'all' ? operation : undefined,
  });

  const logs: AuditLogEntry[] = data?.data ?? [];
  const selected = logs.find((l: AuditLogEntry) => l.id === selectedId) ?? null;

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
        <p className="text-sm font-semibold text-foreground">Failed to load audit entries</p>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : 'The audit log request could not be completed.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by entity, actor, operation…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={operation} onValueChange={(v) => { setOperation(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All operations</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="RESTORE">Restore</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries found"
          description="Try adjusting your search or filters to see change records."
        />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-2xs uppercase tracking-wider">Operation</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Entity</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Actor</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Severity</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Timestamp</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider text-right">Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: AuditLogEntry) => (
                  <motion.tr
                    key={log.id}
                    variants={row}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => setSelectedId(log.id)}
                  >
                    <TableCell><OperationBadge operation={log.operation} /></TableCell>
                    <TableCell className="font-medium">{log.entityName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.actor.name}</span>
                        <span className="text-2xs text-muted-foreground">{log.actor.role}</span>
                      </div>
                    </TableCell>
                    <TableCell><SeverityBadge severity={log.severity} /></TableCell>
                    <TableCell><AuditStatusBadge status={log.status} /></TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{formatRelative(log.createdAt)}</span>
                        <span className="text-2xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <code className="font-mono text-2xs text-muted-foreground">
                        {/* No hash chain is implemented - render an explicit
                            placeholder instead of a fabricated value. */}
                        {log.hash ? `${log.hash.slice(0, 10)}…` : '—'}
                      </code>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {/* Show the one-based UI page, not the zero-based API page. */}
                Page {page} of {data.totalPages} · {data.total} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AuditLogDetailDrawer
        entry={selected}
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
