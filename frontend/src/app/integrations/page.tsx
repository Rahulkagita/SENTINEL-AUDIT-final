export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { IntegrationGrid } from '@/features/integrations/components/integration-grid';

export default function IntegrationsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Integrations"
        description="Connect any business application — healthcare, banking, education, ERP, CRM, HRMS — to start tracking changes."
      />
      <IntegrationGrid />
    </AppShell>
  );
}
