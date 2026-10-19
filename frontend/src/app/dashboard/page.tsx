export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { DashboardRefreshButton } from '@/features/dashboard/components/dashboard-refresh-button';

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Overview of tracked assets, versions, and audit activity from the backend."
        actions={<DashboardRefreshButton />}
      />
      <DashboardOverview />
    </AppShell>
  );
}
