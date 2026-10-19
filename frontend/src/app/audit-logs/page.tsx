export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { AuditLogTable } from '@/features/audit-logs/components/audit-log-table';

export default function AuditLogsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Audit Logs"
        description="Record of every create, update, delete, and restore operation recorded by the backend."
      />
      <AuditLogTable />
    </AppShell>
  );
}
