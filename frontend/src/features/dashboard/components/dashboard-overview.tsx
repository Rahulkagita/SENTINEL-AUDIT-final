'use client';

import Link from 'next/link';
import { AlertCircle, Database, History, ScrollText, Users } from 'lucide-react';

import { StatCard } from '@/components/common/stat-card';
import { CardGridSkeleton } from '@/components/common/loading-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useDashboardSummary } from '@/hooks/use-dashboard';

import { DashboardCharts } from './dashboard-charts';
import { DashboardActivityFeed } from './dashboard-activity-feed';

export function DashboardOverview() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="text-sm font-medium">Failed to load dashboard summary</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'The backend could not be reached.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Protected Assets"
          value={data.totalAssets}
          icon={Database}
          accent="primary"
        />
        <StatCard
          label="Version History"
          value={data.totalVersions}
          icon={History}
          accent="success"
        />
        <StatCard
          label="Audit Logs"
          value={data.totalAuditLogs}
          icon={ScrollText}
          accent="warning"
        />
        <StatCard
          label="Users"
          value={data.totalUsers}
          icon={Users}
          accent="info"
        />
      </div>

      {data.totalAssets === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Database className="h-8 w-8 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium">No assets tracked yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first asset to start recording changes and version history.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/entities">Create an asset</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <DashboardCharts />
          <DashboardActivityFeed />
        </>
      )}
    </div>
  );
}
