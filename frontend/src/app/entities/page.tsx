export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ProtectedAssetsTable } from '@/features/entities/components/entity-table';

export default function EntitiesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Protected Assets"
        description="Data assets tracked by SentinelAudit. Every create, update, and delete is recorded in the audit log with version history."
      />
      <div className="mt-4">
        <ProtectedAssetsTable />
      </div>
    </AppShell>
  );
}
