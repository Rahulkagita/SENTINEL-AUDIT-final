export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { ProtectedAssetsTable } from '@/features/entities/components/entity-table';

export default function EntitiesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Protected Assets"
        description="Enterprise databases, directory structures, and file tables tracked by SentinelAudit's cryptographic ledger."
      />
      <div className="mt-4">
        <ProtectedAssetsTable />
      </div>
    </AppShell>
  );
}
