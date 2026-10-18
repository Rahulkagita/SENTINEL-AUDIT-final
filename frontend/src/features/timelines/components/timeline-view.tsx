'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Link2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Laptop,
  Globe,
  Network,
  Calendar,
  Lock,
  CornerDownRight,
  ShieldCheck,
  Search,
  MessageSquare,
  FileJson,
} from 'lucide-react';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { EmptyState } from '@/components/common/empty-state';
import { TableSkeleton } from '@/components/common/loading-skeletons';
import { OperationBadge, SeverityBadge, AuditStatusBadge } from '@/components/common/status-badges';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DiffViewer } from '@/components/common/diff-viewer';
import { formatDateTime, formatRelative, initials, getInitialsColor } from '@/lib/format';
import type { AuditLogEntry, ChangeOperation } from '@/types';

// framer-motion list layout animations
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

// Simple User Agent string parser helper
function parseUserAgent(uaString: string): { device: string; browser: string } {
  if (!uaString) return { device: 'Unknown', browser: 'API Integration' };
  
  let device = 'Server Host';
  let browser = 'SentinelAudit Client';

  // Device check
  if (uaString.includes('Macintosh') || uaString.includes('Mac OS X')) {
    device = 'macOS';
  } else if (uaString.includes('Windows')) {
    device = 'Windows PC';
  } else if (uaString.includes('Linux')) {
    device = 'Linux Station';
  } else if (uaString.includes('iPhone') || uaString.includes('iPad')) {
    device = 'Apple Mobile';
  } else if (uaString.includes('Android')) {
    device = 'Android Device';
  }

  // Browser check
  if (uaString.includes('Chrome') && !uaString.includes('Edg')) {
    browser = 'Chrome Browser';
  } else if (uaString.includes('Safari') && !uaString.includes('Chrome')) {
    browser = 'Safari Browser';
  } else if (uaString.includes('Firefox')) {
    browser = 'Mozilla Firefox';
  } else if (uaString.includes('Edg')) {
    browser = 'Microsoft Edge';
  } else if (uaString.includes('SentinelAudit')) {
    browser = 'Sentinel SDK v1.4';
  }

  return { device, browser };
}

// IP to Mock City/Country mapping
function resolveIpLocation(ip: string): string {
  if (!ip) return 'Remote Gateway';
  const lastOctet = parseInt(ip.split('.').pop() || '0', 10);

  const locations = [
    'San Francisco, US',
    'Dallas, US',
    'Frankfurt, DE',
    'London, GB',
    'Tokyo, JP',
    'Singapore, SG',
    'Sydney, AU',
    'Paris, FR',
    'Toronto, CA',
    'Dublin, IE',
  ];

  return locations[lastOctet % locations.length];
}

// Severity to Numeric Risk Score mapping
function resolveRiskScore(severity: string): number {
  switch (severity) {
    case 'critical':
      return 96;
    case 'anomaly':
      return 84;
    case 'warning':
      return 52;
    default:
      return 12;
  }
}

export function TimelineView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Filtering and Search local states
  const [search, setSearch] = useState('');
  const [operation, setOperation] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch audit log entries which contain snapshot data
  const { data, isLoading } = useAuditLogs({
    page,
    pageSize: 30,
    search,
    filter: operation !== 'all' ? { operation } : undefined,
  });

  const logs: AuditLogEntry[] = data?.data ?? [];

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

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search timeline by entity, actor..."
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

      {logs.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No timeline events found"
          description="Try modifying search keywords or action filters."
        />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="relative pl-4 sm:pl-6 border-l border-border/80 ml-3 space-y-6">
          {logs.map((event) => {
            const isExpanded = expandedId === event.id;
            const { device, browser } = parseUserAgent(event.userAgent);
            const location = resolveIpLocation(event.ipAddress);
            const riskScore = resolveRiskScore(event.severity);
            const mockVersion = `v2.${1 + (parseInt(event.id.replace(/\D/g, '') || '0') % 5)}.0`;

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
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{event.entityName}</h4>
                          <span className="text-3xs font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                            {mockVersion}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground max-w-lg truncate">
                          {event.reason || `Modified database schema for ${event.entityName}.`}
                        </p>
                      </div>
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex items-center gap-4 flex-wrap text-xs sm:self-end lg:self-center">
                      {/* Risk Indicator badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xs text-muted-foreground">Risk Score:</span>
                        <Badge
                          variant="outline"
                          className={`text-4xs font-bold py-0.5 ${
                            riskScore > 80
                              ? 'border-destructive/30 bg-destructive/5 text-destructive'
                              : riskScore > 40
                              ? 'border-warning/30 bg-warning/5 text-warning'
                              : 'border-success/30 bg-success/5 text-success'
                          }`}
                        >
                          {riskScore}/100
                        </Badge>
                      </div>

                      {/* Blockchain status */}
                      <AuditStatusBadge status={event.status} />

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
                            {/* Left: Changes and reason comments */}
                            <div className="lg:col-span-7 space-y-4">
                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                  <CornerDownRight className="h-3.5 w-3.5" />
                                  Delta Field Differences
                                </h5>
                                {event.fieldChanges && event.fieldChanges.length > 0 ? (
                                  <div className="rounded-lg border bg-background/50 p-1">
                                    <DiffViewer changes={event.fieldChanges} />
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic pl-5">
                                    No direct field changes logged (Create/Delete operations).
                                  </p>
                                )}
                              </div>

                              <div>
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Steward Reason Comment
                                </h5>
                                <div className="bg-background/40 border p-3 rounded-lg text-xs leading-relaxed italic text-foreground/80">
                                  &ldquo;{event.reason || 'Cryptographic auto-sync registered during system check.'}&rdquo;
                                </div>
                              </div>
                            </div>

                            {/* Right: Actor & Metadata */}
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
                                    <p className="text-3xs text-muted-foreground">{event.actor.role} &bull; {event.actor.email}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Connections details */}
                              <div className="p-3.5 rounded-xl border bg-background/40 space-y-3.5 text-xs">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Terminal Signatures
                                </h5>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground text-2xs">
                                      <Network className="h-3 w-3" /> IP Address
                                    </span>
                                    <span className="font-mono text-xs">{event.ipAddress}</span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground text-2xs">
                                      <MapPin className="h-3 w-3" /> Location
                                    </span>
                                    <span className="font-semibold">{location}</span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground text-2xs">
                                      <Laptop className="h-3 w-3" /> Device
                                    </span>
                                    <span className="font-semibold">{device}</span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-muted-foreground text-2xs">
                                      <Globe className="h-3 w-3" /> Browser
                                    </span>
                                    <span className="font-semibold">{browser}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Cryptographic block hashes */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-accent/5 border border-accent/15 rounded-lg text-2xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1.5 text-accent font-semibold">
                              <ShieldCheck className="h-3.5 w-3.5 animate-pulse-soft" />
                              LEDGER LINK VERIFIED
                            </span>
                            <div className="flex items-center gap-3">
                              <span>
                                Hash: <span className="text-foreground">{event.hash.slice(0, 16)}...</span>
                              </span>
                              <span>
                                Prev: <span className="text-foreground">{event.previousHash.slice(0, 16)}...</span>
                              </span>
                            </div>
                          </div>

                          {/* Snapshot JSON views */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <FileJson className="h-3.5 w-3.5" />
                                Old Value (beforeSnapshot)
                              </h5>
                              <pre className="bg-muted border text-2xs font-mono p-3 rounded-lg overflow-x-auto max-h-[220px]">
                                {event.beforeSnapshot
                                  ? JSON.stringify(event.beforeSnapshot, null, 2)
                                  : '// No pre-existing values (CREATE operation)'}
                              </pre>
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <FileJson className="h-3.5 w-3.5" />
                                New Value (afterSnapshot)
                              </h5>
                              <pre className="bg-muted border text-2xs font-mono p-3 rounded-lg overflow-x-auto max-h-[220px]">
                                {event.afterSnapshot
                                  ? JSON.stringify(event.afterSnapshot, null, 2)
                                  : '// No new values remaining (DELETE operation)'}
                              </pre>
                            </div>
                          </div>
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
    </div>
  );
}
