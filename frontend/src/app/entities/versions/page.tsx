'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GitBranch,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  GitCompare,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { initials, formatDateTime, formatRelative } from '@/lib/format';
import { useEntities } from '@/hooks/use-entities';
import { useVersions, useRestoreVersion } from '@/hooks/use-versions';
import { EmptyState } from '@/components/common/empty-state';
import type { Entity } from '@/types';
import type { VersionResponse } from '@/services/version';

// Stagger variant animations
const listAnimation = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const cardAnimation = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function VersionHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // No hardcoded default — fall back to the first real asset once loaded.
  const urlAssetId = searchParams.get('assetId');

  // Load all assets to populate the selector dropdown
  const { data: assetsData, isLoading: assetsLoading } = useEntities({ page: 1, pageSize: 50 });
  const assets: Entity[] = useMemo(() => assetsData?.data ?? [], [assetsData?.data]);

  const activeAssetId = useMemo(() => {
    if (urlAssetId && assets.some((a) => a.id === urlAssetId)) return urlAssetId;
    return assets[0]?.id ?? '';
  }, [urlAssetId, assets]);

  const activeAsset = assets.find((a) => a.id === activeAssetId) || null;

  // Load versions directly from VersionService
  const { data: versionsData, isLoading } = useVersions(activeAssetId);
  const versions: VersionResponse[] = useMemo(() => versionsData?.data ?? [], [versionsData]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [cardPage, setCardPage] = useState(1);
  const cardsPerPage = 5;

  const [selectedVersionName, setSelectedVersionName] = useState<string | null>(null);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const restoreVersionMutation = useRestoreVersion();
  const isRestoring = restoreVersionMutation.isPending;

  // Clear the stale selection when switching assets
  useEffect(() => {
    setSelectedVersionName(null);
    setCardPage(1);
  }, [activeAssetId]);

  // Filtered versions list
  const filteredVersions = useMemo(() => {
    return versions.filter((ver: VersionResponse) => {
      return (
        ver.versionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ver.log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ver.log.reason && ver.log.reason.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [versions, searchQuery]);

  // Paginated versions list
  const paginatedVersions = useMemo(() => {
    const start = (cardPage - 1) * cardsPerPage;
    return filteredVersions.slice(start, start + cardsPerPage);
  }, [filteredVersions, cardPage]);

  const totalCardPages = Math.ceil(filteredVersions.length / cardsPerPage) || 1;

  // Selected Version object
  const activeVersion = useMemo(() => {
    if (selectedVersionName) {
      return versions.find((v: VersionResponse) => v.versionName === selectedVersionName) || versions[0];
    }
    return versions[0];
  }, [versions, selectedVersionName]);

  // Previous Version object (for the split-view comparison)
  const previousVersion = useMemo(() => {
    if (!activeVersion) return null;
    const currentIndex = versions.findIndex((v: VersionResponse) => v.versionName === activeVersion.versionName);
    if (currentIndex === -1 || currentIndex === versions.length - 1) return null; // Oldest has no previous
    return versions[currentIndex + 1]; // Next in the list (since list is sorted newest first)
  }, [versions, activeVersion]);

  // Handle Restore — real POST /api/versions/restore. The backend preserves
  // history (the pre-restore state stays stored) and records a RESTORE
  // audit event for the operation.
  const handleRestore = async () => {
    if (!activeVersion) return;
    try {
      const res = await restoreVersionMutation.mutateAsync({
        assetId: activeAssetId,
        versionName: activeVersion.versionName,
      });
      setIsRestoreOpen(false);
      toast.success(res.message || `Restored ${activeAsset?.displayName} to ${activeVersion.versionName}.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore asset version');
    }
  };

  const activeSnapshot = activeVersion?.log.afterSnapshot || {};
  const prevSnapshot = previousVersion?.log.afterSnapshot || {};

  const noAssets = !assetsLoading && assets.length === 0;

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/entities')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-muted-foreground">Back to Protected Assets</span>
      </div>

      <PageHeader
        title="Version History"
        description="State snapshots captured at each change. Restoring a version records a RESTORE event and preserves previous history."
        actions={
          assets.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Asset:</span>
              <Select
                value={activeAssetId}
                onValueChange={(v) => router.push(`/entities/versions?assetId=${v}`)}
              >
                <SelectTrigger className="w-[200px] h-9 text-xs bg-background">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : undefined
        }
      />

      {noAssets ? (
        <EmptyState
          icon={GitBranch}
          title="No assets yet"
          description="Version history is captured per asset. Create an asset first to start recording versions."
          action={
            <Button size="sm" onClick={() => router.push('/entities')}>
              Go to Protected Assets
            </Button>
          }
        />
      ) : isLoading || assetsLoading ? (
        <div className="py-12 flex justify-center items-center">
          <Clock className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : versions.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No versions recorded"
          description={`No version snapshots exist for ${activeAsset?.displayName || 'this asset'} yet. Snapshots are captured on every change.`}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
          {/* ===== Left: Version List Sidebar (4 Cols) ===== */}
          <div className="xl:col-span-4 space-y-4">
            {/* Sidebar Search and Filters */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search version number, actor…"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCardPage(1); }}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Version Cards list */}
            <motion.div
              variants={listAnimation}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {paginatedVersions.map((ver: VersionResponse) => {
                const isActive = activeVersion?.versionName === ver.versionName;
                return (
                  <motion.div
                    key={ver.versionName}
                    variants={cardAnimation}
                    onClick={() => setSelectedVersionName(ver.versionName)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {ver.versionName}
                        </span>
                      </div>
                    </div>

                    <p className="text-2xs text-muted-foreground mt-2 line-clamp-1">
                      {ver.log.reason || 'State snapshot captured.'}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-dashed border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-primary/10 text-primary text-4xs font-semibold">
                            {initials(ver.log.actor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-3xs font-medium text-foreground">{ver.log.actor.name}</span>
                      </div>
                      <span className="text-3xs text-muted-foreground">
                        {formatRelative(ver.log.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {filteredVersions.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No matching versions.
                </div>
              )}
            </motion.div>

            {/* Pagination Controls */}
            {totalCardPages > 1 && (
              <div className="flex items-center justify-between bg-card border rounded-xl p-3 text-xs text-muted-foreground">
                <span>Page {cardPage} of {totalCardPages}</span>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={cardPage <= 1}
                    onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={cardPage >= totalCardPages}
                    onClick={() => setCardPage((p) => Math.min(totalCardPages, p + 1))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ===== Right: Version Snapshot & Comparison Details (8 Cols) ===== */}
          <div className="xl:col-span-8 space-y-4">
            {activeVersion && (
              <div className="rounded-xl border bg-card p-5 space-y-5">
                {/* Selected Version Metadata Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">{activeVersion.versionName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(activeVersion.log.createdAt)} ({formatRelative(activeVersion.log.createdAt)})
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Modified by: <strong className="text-foreground">{activeVersion.log.actor.name}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Restore Trigger button */}
                    <Button variant="outline" size="sm" onClick={() => setIsRestoreOpen(true)}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restore Version
                    </Button>
                  </div>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="compare" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-[340px] mb-4">
                    <TabsTrigger value="preview" className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Snapshot Preview
                    </TabsTrigger>
                    <TabsTrigger value="compare" className="flex items-center gap-1.5">
                      <GitCompare className="h-3.5 w-3.5" />
                      Compare Changes
                    </TabsTrigger>
                  </TabsList>

                  {/* 1. Snapshot Preview tab */}
                  <TabsContent value="preview" className="space-y-4 mt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                        <span>Captured State</span>
                      </div>
                      <pre className="bg-muted p-4 rounded-xl border text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed">
                        {JSON.stringify(activeSnapshot, null, 2)}
                      </pre>
                    </div>

                    <div className="bg-muted/10 p-4 rounded-xl border text-xs text-muted-foreground">
                      This snapshot is the asset state stored by the backend at{' '}
                      {formatDateTime(activeVersion.log.createdAt)}. No per-field change list or
                      integrity hash is recorded by this platform.
                    </div>
                  </TabsContent>

                  {/* 2. Compare Changes Tab (Split View) */}
                  <TabsContent value="compare" className="space-y-4 mt-0">
                    {!previousVersion ? (
                      <div className="py-12 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
                        This is the oldest recorded version — there is no earlier snapshot to compare against.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* GitHub-style Split Grid */}
                        <div className="rounded-xl border overflow-hidden">
                          {/* Split Header */}
                          <div className="grid grid-cols-2 bg-muted/60 text-2xs font-semibold border-b divide-x divide-border">
                            <div className="p-2.5 flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Previous: {previousVersion.versionName}</span>
                            </div>
                            <div className="p-2.5 flex items-center gap-1.5 text-foreground">
                              <Clock className="h-3 w-3 text-primary" />
                              <span>Current: {activeVersion.versionName}</span>
                            </div>
                          </div>

                          {/* Split Diff Content Body */}
                          <div className="divide-y divide-border/60 bg-card font-mono text-2xs leading-relaxed max-h-[380px] overflow-y-auto">
                            {Array.from(new Set([...Object.keys(activeSnapshot), ...Object.keys(prevSnapshot)])).map((key) => {
                              const inCur = key in activeSnapshot;
                              const inPrev = key in prevSnapshot;

                              const valCur = inCur ? activeSnapshot[key] : undefined;
                              const valPrev = inPrev ? prevSnapshot[key] : undefined;

                              // Addition row
                              if (inCur && !inPrev) {
                                return (
                                  <div key={key} className="grid grid-cols-2 divide-x divide-border">
                                    <div className="bg-muted/10 p-2 text-muted-foreground/40 select-none">
                                      {/* Empty spacer on previous */}
                                    </div>
                                    <div className="bg-success/10 p-2 text-success">
                                      <span>+ &quot;{key}&quot;: {JSON.stringify(valCur)}</span>
                                    </div>
                                  </div>
                                );
                              }

                              // Deletion row
                              if (!inCur && inPrev) {
                                return (
                                  <div key={key} className="grid grid-cols-2 divide-x divide-border">
                                    <div className="bg-destructive/10 p-2 text-destructive">
                                      <span>- &quot;{key}&quot;: {JSON.stringify(valPrev)}</span>
                                    </div>
                                    <div className="bg-muted/10 p-2 text-muted-foreground/40 select-none">
                                      {/* Empty spacer on current */}
                                    </div>
                                  </div>
                                );
                              }

                              // Modification row
                              if (JSON.stringify(valCur) !== JSON.stringify(valPrev)) {
                                return (
                                  <div key={key} className="grid grid-cols-2 divide-x divide-border">
                                    <div className="bg-warning/10 p-2 text-warning/80">
                                      <span>&delta; &quot;{key}&quot;: {JSON.stringify(valPrev)}</span>
                                    </div>
                                    <div className="bg-warning/15 p-2 text-warning font-semibold">
                                      <span>&delta; &quot;{key}&quot;: {JSON.stringify(valCur)}</span>
                                    </div>
                                  </div>
                                );
                              }

                              // Unchanged row
                              return (
                                <div key={key} className="grid grid-cols-2 divide-x divide-border">
                                  <div className="p-2 text-muted-foreground/60">
                                    <span>  &quot;{key}&quot;: {JSON.stringify(valPrev)}</span>
                                  </div>
                                  <div className="p-2 text-muted-foreground/60">
                                    <span>  &quot;{key}&quot;: {JSON.stringify(valCur)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <p className="text-2xs text-muted-foreground">
                          Comparison is computed in the browser from the two stored snapshots.
                          The backend does not record per-field diffs.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Restore Confirmation Dialog ===== */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              Restore <strong className="text-foreground">{activeAsset?.displayName}</strong> to{' '}
              <strong className="text-foreground">{activeVersion?.versionName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/20 border p-3 rounded-lg text-xs leading-relaxed text-muted-foreground">
            The backend applies the snapshot state to the asset, keeps all existing version
            history, and records a RESTORE operation in the audit log.
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsRestoreOpen(false)} disabled={isRestoring}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Clock className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Restoring…
                </>
              ) : (
                'Confirm Restore'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
