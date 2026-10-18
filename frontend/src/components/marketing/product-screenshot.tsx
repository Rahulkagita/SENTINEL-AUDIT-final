'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Fingerprint,
  GitBranch,
  Lock,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'dashboard' | 'audit-log' | 'timeline' | 'anomaly';

interface ProductScreenshotProps {
  variant?: Variant;
  className?: string;
}

export function ProductScreenshot({ variant = 'dashboard', className }: ProductScreenshotProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card shadow-elevated',
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-warning/60" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
        </div>
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-background/60 px-3 text-2xs text-muted-foreground">
          app.sentinelaudit.ai/{variant}
        </div>
      </div>

      <div className="p-5">
        {variant === 'dashboard' && <DashboardMockup />}
        {variant === 'audit-log' && <AuditLogMockup />}
        {variant === 'timeline' && <TimelineMockup />}
        {variant === 'anomaly' && <AnomalyMockup />}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Changes', value: '43,148', icon: Activity, color: 'text-primary' },
          { label: 'Open Anomalies', value: '7', icon: ShieldCheck, color: 'text-destructive' },
          { label: 'Integrations', value: '12', icon: Database, color: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
            </div>
            <p className="mt-1.5 text-xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-xl border border-border bg-background/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium">Change Activity</span>
            <span className="text-2xs text-muted-foreground">Last 14 days</span>
          </div>
          <div className="flex h-32 items-end gap-1.5">
            {[40, 65, 50, 80, 55, 90, 70, 100, 75, 110, 85, 95, 120, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-accent/60"
              />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <span className="text-xs font-medium">Verification Rate</span>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--success))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  initial={{ strokeDashoffset: 251 }}
                  whileInView={{ strokeDashoffset: 25 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold">90%</span>
                <span className="text-2xs text-muted-foreground">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditLogMockup() {
  const rows = [
    { op: 'UPDATE', entity: 'Patient Record #4821', actor: 'S. Chen', status: 'verified' },
    { op: 'DELETE', entity: 'Account #9920', actor: 'M. Webb', status: 'flagged' },
    { op: 'CREATE', entity: 'Policy #3341', actor: 'P. Nair', status: 'verified' },
    { op: 'UPDATE', entity: 'Employee #2104', actor: 'D. Okafor', status: 'pending' },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-4 gap-2 border-b border-border bg-muted/40 px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Operation</span>
        <span>Entity</span>
        <span>Actor</span>
        <span>Status</span>
      </div>
      {rows.map((row, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="grid grid-cols-4 gap-2 border-b border-border/50 px-3 py-2.5 text-xs last:border-0"
        >
          <span
            className={cn(
              'font-medium',
              row.op === 'UPDATE' && 'text-info',
              row.op === 'DELETE' && 'text-destructive',
              row.op === 'CREATE' && 'text-success',
            )}
          >
            {row.op}
          </span>
          <span className="truncate font-medium">{row.entity}</span>
          <span className="text-muted-foreground">{row.actor}</span>
          <span
            className={cn(
              'flex items-center gap-1',
              row.status === 'verified' && 'text-success',
              row.status === 'flagged' && 'text-destructive',
              row.status === 'pending' && 'text-warning',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {row.status}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function TimelineMockup() {
  const events = [
    { op: 'CREATE', label: 'Record created', time: '2:14 PM', color: 'bg-success' },
    { op: 'UPDATE', label: 'Diagnosis updated', time: '3:42 PM', color: 'bg-info' },
    { op: 'UPDATE', label: 'Insurance ID changed', time: '4:01 PM', color: 'bg-warning' },
    { op: 'DELETE', label: 'Record archived', time: '5:30 PM', color: 'bg-destructive' },
  ];
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
      {events.map((event, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="relative mb-4 last:mb-0"
        >
          <span className={cn('absolute -left-[18px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background', event.color)} />
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{event.label}</span>
              <span className="text-2xs text-muted-foreground">{event.time}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
              <Fingerprint className="h-3 w-3" />
              <code className="font-mono">a3f2c1...d4e5</code>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AnomalyMockup() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-chart-6/20 bg-chart-6/5 px-3 py-2 text-xs">
        <ShieldCheck className="h-4 w-4 text-chart-6" />
        <span className="text-muted-foreground">3 anomalies detected by AI engine</span>
      </div>
      {[
        { title: 'Unusual bulk modification', score: 92, signals: ['Off-hours', 'Bulk edit', 'Sensitive field'] },
        { title: 'Privileged account deviation', score: 78, signals: ['Rare entity', 'Actor deviation'] },
      ].map((anomaly, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-border bg-background/50 p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{anomaly.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {anomaly.signals.map((s) => (
                  <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums text-chart-6">{anomaly.score}%</div>
              <div className="text-2xs text-muted-foreground">confidence</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${anomaly.score}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full rounded-full bg-chart-6"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
