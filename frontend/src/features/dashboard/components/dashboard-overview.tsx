'use client';

import { Database, History, ScrollText, Users } from 'lucide-react';

import { StatCard } from '@/components/common/stat-card';
import { CardGridSkeleton } from '@/components/common/loading-skeletons';

import { useDashboardSummary } from '@/hooks/use-dashboard';

import { DashboardCharts } from './dashboard-charts';
import { DashboardActivityFeed } from './dashboard-activity-feed';

export function DashboardOverview() {

    const query = useDashboardSummary();

console.log(query);

const { data, isLoading } = query;

    if (isLoading || !data) {

        return (
            <div className="space-y-6">
                <CardGridSkeleton count={4} />
            </div>
        );

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

             <DashboardCharts /> 

            <DashboardActivityFeed/> 

        </div>

    );

}