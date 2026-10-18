export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { AnomalyList } from '@/features/anomalies/components/anomaly-list';

export default function AnomaliesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Anomalies"
        description="AI-detected and rule-based anomalies flagged for review. Triage, investigate, and resolve."
      />
      <AnomalyList />
    </AppShell>
  );
}
