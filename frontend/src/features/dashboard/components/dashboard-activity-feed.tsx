'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Database, Eye } from 'lucide-react';

import { useRecentActivities } from '@/hooks/use-dashboard';
import type { RecentActivity } from '@/services/dashboard';

export function DashboardActivityFeed() {
  const {
    data: activities = [],
    isLoading,
    isError,
    refetch,
  } = useRecentActivities();

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="flex flex-col space-y-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-xs">
            Latest audit events recorded by the backend
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/audit-logs">View all audit logs</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Loading recent activities…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load recent activities.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20">
            <Database className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs text-muted-foreground">
              Audit events appear here once you create or modify assets.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((event: RecentActivity) => (
              <div key={event.id} className="py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{event.assetName}</span>
                      <Badge
                        variant="outline"
                        className={
                          event.action === 'CREATE'
                            ? 'border-green-500 text-green-600'
                            : event.action === 'DELETE'
                            ? 'border-red-500 text-red-600'
                            : 'border-blue-500 text-blue-600'
                        }
                      >
                        {event.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <strong>{event.username}</strong>
                      {' • '}
                      {event.remarks || 'No remarks'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/audit-logs?search=${event.assetId}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View this asset's events in audit logs</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
