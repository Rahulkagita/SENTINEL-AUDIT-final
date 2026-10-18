'use client';

import { motion } from 'framer-motion';
import { Plug, Search } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { CardGridSkeleton } from '@/components/common/loading-skeletons';
import { IntegrationStatusBadge } from '@/components/common/status-badges';
import { useIntegrations } from '@/hooks/use-integrations';
import { formatCompactNumber, formatRelative } from '@/lib/format';
import type { Integration } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const categoryLabels: Record<string, string> = {
  healthcare: 'Healthcare',
  banking: 'Banking',
  education: 'Education',
  government: 'Government',
  legal: 'Legal',
  insurance: 'Insurance',
  erp: 'ERP',
  crm: 'CRM',
  hrms: 'HRMS',
  custom: 'Custom',
};

export function IntegrationGrid() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useIntegrations({ page: 1, pageSize: 50, search });
  const integrations: Integration[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <Plug className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : integrations.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No integrations connected"
          description="Connect a business application to start tracking changes to its sensitive data."
          action={
            <Button>
              <Plug className="mr-2 h-4 w-4" />
              Add your first integration
            </Button>
          }
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {integrations.map((integration) => (
            <motion.div key={integration.id} variants={item}>
              <Card className="group transition-all hover:shadow-elevated hover:border-primary/30">
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                      <Plug className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <p className="text-2xs text-muted-foreground">
                        {categoryLabels[integration.category] ?? integration.category}
                      </p>
                    </div>
                  </div>
                  <IntegrationStatusBadge status={integration.status} />
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{integration.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                        Records
                      </p>
                      <p className="text-base font-semibold tabular-nums">
                        {formatCompactNumber(integration.recordCount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                        Changes
                      </p>
                      <p className="text-base font-semibold tabular-nums text-primary">
                        {formatCompactNumber(integration.changeCount)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">API key</span>
                      <code className="font-mono text-2xs">{integration.apiKeyMasked}</code>
                    </div>
                    {integration.lastSyncAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Last sync</span>
                        <span>{formatRelative(integration.lastSyncAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      Configure
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
