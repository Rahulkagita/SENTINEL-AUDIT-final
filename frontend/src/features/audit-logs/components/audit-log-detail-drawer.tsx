'use client';

import { motion } from 'framer-motion';
import { Globe, Info, Monitor, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { OperationBadge } from '@/components/common/status-badges';
import { DiffViewer } from '@/components/common/diff-viewer';
import { formatDateTime, formatRelative, initials, getInitialsColor } from '@/lib/format';
import type { AuditLogEntry } from '@/types';

interface AuditLogDetailDrawerProps {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailDrawer({ entry, open, onOpenChange }: AuditLogDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto scrollbar-thin sm:max-w-2xl">
        {entry ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center gap-2">
                <OperationBadge operation={entry.operation} />
              </div>
              <SheetTitle className="text-xl">{entry.entityName}</SheetTitle>
              <SheetDescription>
                Change recorded {formatRelative(entry.createdAt)} ·{' '}
                {formatDateTime(entry.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={getInitialsColor(entry.actor.name)}>
                      {initials(entry.actor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{entry.actor.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.actor.role}
                      {entry.actor.email ? ` · ${entry.actor.email}` : ''}
                    </p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">IP:</span>
                    {/* The backend does not capture client IP — show an explicit
                        placeholder rather than an empty string. */}
                    <code className="font-mono">{entry.ipAddress || 'not captured'}</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Source:</span>
                    <span>{entry.sourceApplication || 'SentinelAudit'}</span>
                  </div>
                  {entry.reason && (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="text-muted-foreground">Reason:</span>
                      <span>{entry.reason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Field Changes</h4>
                {entry.fieldChanges && entry.fieldChanges.length > 0 ? (
                  <DiffViewer changes={entry.fieldChanges} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No field-level changes recorded for this entry. The backend stores the
                    operation, actor, and asset reference, but does not capture per-field
                    diffs or before/after snapshots.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  About integrity verification
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  This platform does not implement a cryptographic hash chain, so no entry
                  hash or previous-entry hash is available for this record. Entries are
                  durable rows in the audit table, not tamper-evident proofs.
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No entry selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
