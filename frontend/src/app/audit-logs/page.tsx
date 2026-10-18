export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { AuditLogTable } from '@/features/audit-logs/components/audit-log-table';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuditLogsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Audit Logs"
        description="Immutable, tamper-evident record of every create, update, and delete operation across all connected systems."
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <AuditLogTable />
    </AppShell>
  );
}
