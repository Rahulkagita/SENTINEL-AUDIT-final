'use client';

import type { AuditAction } from '@/services/dashboard';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { useAuditActions, useAssetsByType, useVersionGrowth } from '@/hooks/use-dashboard';

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#dc2626', '#7c3aed', '#0891b2'];

function ChartState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function DashboardCharts() {
  const {
    data: auditActions,
    isLoading: actionsLoading,
    isError: actionsError,
  } = useAuditActions();

  const {
    data: assetTypes,
    isLoading: typesLoading,
    isError: typesError,
  } = useAssetsByType();

  const {
    data: versionGrowth,
    isLoading: growthLoading,
    isError: growthError,
  } = useVersionGrowth();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {actionsLoading ? (
            <ChartState>Loading…</ChartState>
          ) : actionsError ? (
            <ChartState>Failed to load audit action counts.</ChartState>
          ) : !auditActions || auditActions.length === 0 ? (
            <ChartState>No audit events recorded yet.</ChartState>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={auditActions}
                    dataKey="count"
                    nameKey="action"
                    outerRadius={120}
                    label
                  >
                    {auditActions.map((item: AuditAction, index: number) => (
                      <Cell key={item.action || index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assets By Type</CardTitle>
        </CardHeader>
        <CardContent>
          {typesLoading ? (
            <ChartState>Loading…</ChartState>
          ) : typesError ? (
            <ChartState>Failed to load asset type counts.</ChartState>
          ) : !assetTypes || assetTypes.length === 0 ? (
            <ChartState>No assets tracked yet.</ChartState>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="assetType" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Version Growth</CardTitle>
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <ChartState>Loading…</ChartState>
          ) : growthError ? (
            <ChartState>Failed to load version growth data.</ChartState>
          ) : !versionGrowth || versionGrowth.length === 0 ? (
            <ChartState>No versions recorded yet.</ChartState>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={versionGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
