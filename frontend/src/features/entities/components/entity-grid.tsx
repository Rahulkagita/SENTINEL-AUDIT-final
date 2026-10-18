'use client';

import { motion } from 'framer-motion';
import { Database, Search } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { CardGridSkeleton } from '@/components/common/loading-skeletons';
import { useEntities } from '@/hooks/use-entities';
import { formatCompactNumber, formatRelative } from '@/lib/format';
import type { Entity } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function EntityGrid() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useEntities({ page: 1, pageSize: 50, search });

  const entities: Entity[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search entities or applications…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : entities.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No entities found"
          description="Entities are data sources tracked by SentinelAudit. Connect an integration to start tracking."
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {entities.map((entity) => (
            <motion.div key={entity.id} variants={item}>
              <Card className="group transition-all hover:shadow-elevated hover:border-primary/30">
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">{entity.displayName}</CardTitle>
                    <p className="font-mono text-2xs text-muted-foreground">{entity.name}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{entity.category}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                        Records
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        {formatCompactNumber(entity.recordCount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                        Changes
                      </p>
                      <p className="text-lg font-semibold tabular-nums text-primary">
                        {formatCompactNumber(entity.changeCount)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Source</span>
                      <span className="font-medium">{entity.sourceApplication}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last change</span>
                      <span className="font-medium">{formatRelative(entity.lastChangedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tracked fields</span>
                      <span className="font-medium">{entity.schema.length}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {entity.schema.filter((s) => s.sensitive).slice(0, 3).map((field) => (
                      <Badge key={field.key} variant="outline" className="text-2xs font-normal">
                        {field.label}
                      </Badge>
                    ))}
                    {entity.schema.filter((s) => s.sensitive).length > 3 && (
                      <Badge variant="outline" className="text-2xs font-normal">
                        +{entity.schema.filter((s) => s.sensitive).length - 3} more
                      </Badge>
                    )}
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
