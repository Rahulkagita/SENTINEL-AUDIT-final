export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of change activity, anomalies, and integration health across all tracked systems."
        actions={
          <>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </>
        }
      />
      <DashboardOverview />
    </AppShell>
  );
}
