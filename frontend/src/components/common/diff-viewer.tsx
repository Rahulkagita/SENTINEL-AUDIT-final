'use client';

import { useState } from 'react';
import { ChevronRight, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { FieldChange } from '@/types';

interface DiffViewerProps {
  changes: FieldChange[];
  className?: string;
}

function formatValue(value: unknown, sensitive: boolean, reveal: boolean): string {
  if (value === null || value === undefined) return '—';
  if (sensitive && !reveal) return '••••••••';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function DiffViewer({ changes, className }: DiffViewerProps) {
  const [revealSensitive, setRevealSensitive] = useState(false);
  const hasSensitive = changes.some((c) => c.sensitive);

  return (
    <div className={cn('space-y-3', className)}>
      {hasSensitive && (
        <div className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-warning">
            <Lock className="h-3.5 w-3.5" />
            <span>This entry contains sensitive fields</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setRevealSensitive((v) => !v)}
          >
            {revealSensitive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {revealSensitive ? 'Mask' : 'Reveal'}
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] divide-x divide-border border-b border-border bg-muted/40">
          <div className="px-4 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Field
          </div>
          <div className="px-4 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Before
          </div>
          <div className="px-4 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            After
          </div>
        </div>

        <div className="divide-y divide-border">
          {changes.map((change) => (
            <div
              key={change.field}
              className={cn(
                'grid grid-cols-[1.5fr_1fr_1fr] divide-x divide-border text-sm transition-colors',
                change.changed && 'bg-accent/5',
              )}
            >
              <div className="flex items-center gap-2 px-4 py-3">
                {change.changed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <span className="h-3.5 w-3.5" />
                )}
                <span className="font-medium text-foreground">{change.label}</span>
                {change.sensitive && (
                  <Lock className="h-3 w-3 text-muted-foreground/70" />
                )}
              </div>
              <div className="px-4 py-3">
                <code
                  className={cn(
                    'font-mono text-xs',
                    change.changed
                      ? 'text-destructive line-through decoration-destructive/40'
                      : 'text-muted-foreground',
                  )}
                >
                  {formatValue(change.oldValue, change.sensitive, revealSensitive)}
                </code>
              </div>
              <div className="px-4 py-3">
                <code
                  className={cn(
                    'font-mono text-xs',
                    change.changed ? 'text-success font-medium' : 'text-muted-foreground',
                  )}
                >
                  {formatValue(change.newValue, change.sensitive, revealSensitive)}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
