export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { AssistantChat } from '@/features/assistant/components/assistant-chat';

export default function AssistantPage() {
  return (
    <AppShell>
      <PageHeader
        title="Assistant"
        description="Ask questions about SentinelAudit and your audit data. Answers are grounded in the project documentation and live database reads, and every claim is cited. The assistant is read-only."
      />
      <div className="mt-4">
        <AssistantChat />
      </div>
    </AppShell>
  );
}
