export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Workspace configuration, API keys, and preferences."
      />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        Settings module — ready for implementation
      </div>
    </AppShell>
  );
}
