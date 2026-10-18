export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { TimelineView } from '@/features/timelines/components/timeline-view';

export default function TimelinesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Audit Timeline"
        description="Chronological version history of changes, cryptographically linked to form a tamper-evident chain."
      />
      <TimelineView />
    </AppShell>
  );
}
