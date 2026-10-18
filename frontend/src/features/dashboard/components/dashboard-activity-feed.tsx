'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


import { ShieldAlert, Database, Eye } from 'lucide-react';

import Link from 'next/link';
import { useRecentActivities } from "@/hooks/use-dashboard";
import type { RecentActivity } from "@/services/dashboard";



export function DashboardActivityFeed() {

  const {
    data: activities = [],
    isLoading
  } = useRecentActivities();
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center h-40">
            Loading recent activities...
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="w-full border-border bg-card">
    
        <Tabs defaultValue="audit" className="w-full">

  <CardHeader className="flex flex-col space-y-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">

    <div>
      <CardTitle className="text-base font-semibold">
        Ledger & Integrity Feed
      </CardTitle>

      <CardDescription className="text-xs">
        Real-time audit trails, cryptographic changes, and AI alarms
      </CardDescription>
    </div>

    <TabsList className="grid w-full grid-cols-3 sm:w-[320px] text-xs">

      <TabsTrigger value="alerts">
        Alerts (0)
      </TabsTrigger>

      <TabsTrigger value="versions">
        Versions
      </TabsTrigger>

      <TabsTrigger value="audit">
        Audit Logs
      </TabsTrigger>

    </TabsList>

  </CardHeader>

  <CardContent>

    {/* Alerts */}

    <TabsContent value="alerts">

      <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20">

        <ShieldAlert className="h-8 w-8 text-muted-foreground/60 mb-2" />

        <p className="text-sm font-medium">
          All systems secure
        </p>

        <p className="text-xs text-muted-foreground">
          No AI anomalies or policy alerts detected today.
        </p>

      </div>

    </TabsContent>

    {/* Versions */}

    <TabsContent value="versions">

      <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20">

        <Database className="h-8 w-8 text-muted-foreground/60 mb-2" />

        <p className="text-sm font-medium">
          Version History Module
        </p>

        <p className="text-xs text-muted-foreground">
          This module will be integrated in the next sprint.
        </p>

      </div>

    </TabsContent>

    {/* Audit */}

    <TabsContent value="audit">

      <h3 className="text-sm font-semibold mb-4">
        Recent Audit Logs
      </h3>

      {activities.length === 0 ? (

        <div className="text-center py-10 text-muted-foreground">
          No recent audit logs found.
        </div>

      ) : (

        <div className="divide-y divide-border">

          {activities.map((event: RecentActivity) => (

            <div
              key={event.id}
              className="py-4 flex items-center justify-between"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">

                  <Database className="h-4 w-4" />

                </div>

                <div>

                  <div className="flex items-center gap-2">

                    <span className="font-semibold text-sm">
                      {event.assetName}
                    </span>

                    <Badge
                      variant="outline"
                      className={
                        event.action === "CREATE"
                          ? "border-green-500 text-green-600"
                          : event.action === "DELETE"
                          ? "border-red-500 text-red-600"
                          : "border-blue-500 text-blue-600"
                      }
                    >
                      {event.action}
                    </Badge>

                  </div>

                  <p className="text-xs text-muted-foreground">

                    <strong>{event.username}</strong>

                    {" • "}

                    {event.remarks || "No remarks"}

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-3">

                <div className="text-right">

                  <Badge className="bg-green-600 text-white">
                    VERIFIED
                  </Badge>

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>

                </div>

                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                >
                  <Link href={`/audit-logs?search=${event.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>

              </div>

            </div>

          ))}

        </div>

      )}

    </TabsContent>

  </CardContent>

</Tabs>
    </Card >
  );
}
