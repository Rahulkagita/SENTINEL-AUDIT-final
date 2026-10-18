'use client';

import { motion } from 'framer-motion';
import { ScanSearch, Sparkles, AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/common/empty-state';
import { CardGridSkeleton } from '@/components/common/loading-skeletons';
import {
  AnomalyStatusBadge,
  SeverityBadge,
} from '@/components/common/status-badges';
import { useAnomalies, useUpdateAnomalyStatus } from '@/hooks/use-anomalies';
import { formatRelative } from '@/lib/format';
import type { Anomaly, AnomalyStatus } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function AnomalyList() {
  const { data, isLoading } = useAnomalies({ page: 1, pageSize: 20 });
  const updateStatus = useUpdateAnomalyStatus();
  const anomalies: Anomaly[] = data?.data ?? [];

  if (isLoading) {
    return <CardGridSkeleton count={4} />;
  }

  if (anomalies.length === 0) {
    return (
      <EmptyState
        icon={ScanSearch}
        title="No anomalies detected"
        description="The AI anomaly engine continuously monitors change patterns. Detected anomalies will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-chart-6/20 bg-chart-6/5 px-4 py-2.5 text-sm">
        <Sparkles className="h-4 w-4 text-chart-6" />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{anomalies.length}</span> anomalies detected
          by the AI anomaly engine. Review and triage below.
        </span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 lg:grid-cols-2"
      >
        {anomalies.map((anomaly) => (
          <motion.div key={anomaly.id} variants={item}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 text-chart-6" />
                    <CardTitle className="text-base">{anomaly.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={anomaly.severity} />
                    <AnomalyStatusBadge status={anomaly.status} />
                    <Badge variant="outline" className="text-2xs capitalize">
                      {anomaly.detectedBy === 'ai' ? (
                        <><Sparkles className="mr-1 h-2.5 w-2.5" />AI</>
                      ) : anomaly.detectedBy === 'rule' ? (
                        'Rule'
                      ) : 'Manual'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{anomaly.description}</p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence score</span>
                    <span className="font-medium tabular-nums">
                      {(anomaly.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={anomaly.confidenceScore * 100} className="h-1.5" />
                </div>

                <div>
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Signals
                  </p>
                  <div className="space-y-1.5">
                    {anomaly.signals.map((signal) => (
                      <div key={signal.label} className="flex items-start gap-2 text-xs">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-chart-6" />
                        <div>
                          <span className="font-medium">{signal.label}</span>
                          <span className="text-muted-foreground"> — {signal.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-2xs text-muted-foreground">
                    {anomaly.entityName} · {formatRelative(anomaly.createdAt)}
                  </div>
                  {anomaly.status !== 'resolved' && anomaly.status !== 'dismissed' && (
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate({ id: anomaly.id, status: 'dismissed' as AnomalyStatus })
                        }
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate({ id: anomaly.id, status: 'resolved' as AnomalyStatus })
                        }
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
