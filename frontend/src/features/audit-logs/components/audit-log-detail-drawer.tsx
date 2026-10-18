'use client';

import { motion } from 'framer-motion';
import {
  Fingerprint,
  Globe,
  Hash,
  Monitor,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  OperationBadge,
  SeverityBadge,
  AuditStatusBadge,
} from '@/components/common/status-badges';
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
                <SeverityBadge severity={entry.severity} />
                <AuditStatusBadge status={entry.status} />
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
                      {entry.actor.role} · {entry.actor.email}
                    </p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">IP:</span>
                    <code className="font-mono">{entry.ipAddress}</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Source:</span>
                    <span>{entry.sourceApplication}</span>
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
                <DiffViewer changes={entry.fieldChanges} />
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Tamper-Evident Proof
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Entry hash:</span>
                    <code className="font-mono break-all">{entry.hash}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Previous hash:</span>
                    <code className="font-mono break-all">{entry.previousHash}</code>
                  </div>
                </div>
                <p className="mt-3 text-2xs text-muted-foreground">
                  Each entry is cryptographically linked to the previous one. Any tampering
                  breaks the chain and is immediately detectable.
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
