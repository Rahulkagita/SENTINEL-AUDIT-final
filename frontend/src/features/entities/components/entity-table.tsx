'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Sparkles,
  Lock,
  GitBranch,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { EmptyState } from '@/components/common/empty-state';
import { TableSkeleton } from '@/components/common/loading-skeletons';
import { initials } from '@/lib/format';
import {
  useEntities,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from '@/hooks/use-entities';
import type { Entity, Actor, EntityField } from '@/types';

// Zod Schema for Asset Creation / Editing
const assetFormSchema = z.object({
  displayName: z.string().min(2, 'Title must be at least 2 characters'),
  name: z.string().min(2, 'System key name must be at least 2 characters').regex(/^[a-z_]+$/, 'Must be lowercase letters and underscores only'),
  category: z.string().min(1, 'Category is required'),
  sourceApplication: z.string().min(1, 'Source application is required'),
  department: z.string().min(1, 'Department is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerEmail: z.string().email('Invalid email address'),
  version: z.string().regex(/^v\d+\.\d+(\.\d+)?$/, 'Must follow v1.0 or v1.0.0 format'),
  risk: z.enum(['low', 'medium', 'high']),
  status: z.enum(['connected', 'syncing', 'error', 'disconnected']),
});

type AssetFormInput = z.infer<typeof assetFormSchema>;

export function ProtectedAssetsTable() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  
  // Sort State
  const [sortBy, setSortBy] = useState<keyof Entity>('lastChangedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Dialog / Drawer States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  const [activeAsset, setActiveAsset] = useState<Entity | null>(null);

  // Import Simulator State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // TanStack queries/mutations
  const { data, isLoading } = useEntities({ page: 1, pageSize: 100 });
  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();
  const deleteMutation = useDeleteEntity();

  const entities: Entity[] = useMemo(() => data?.data ?? [], [data?.data]);

  // Filter & Search Logic (local computation for fluid user experience)
  const filteredAssets = useMemo(() => {
    return entities
      .filter((asset) => {
        const ownerName = asset.owner?.name?.toLowerCase() ?? '';
        const matchesSearch =
          asset.displayName?.toLowerCase().includes(search.toLowerCase()) ||
          asset.id?.toLowerCase().includes(search.toLowerCase()) ||
          ownerName.includes(search.toLowerCase());
        const matchesDept = deptFilter === 'all' || asset.department === deptFilter;
        const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
        const matchesRisk = riskFilter === 'all' || asset.risk === riskFilter;
        return matchesSearch && matchesDept && matchesStatus && matchesRisk;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [entities, search, deptFilter, statusFilter, riskFilter, sortBy, sortOrder]);

  // Paginated Slices
  const paginatedAssets = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredAssets.slice(startIndex, startIndex + pageSize);
  }, [filteredAssets, page, pageSize]);

  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;

  // React Hook Form for Create/Edit
  const form = useForm<AssetFormInput>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      displayName: '',
      name: '',
      category: 'healthcare',
      sourceApplication: '',
      department: 'Clinical Operations',
      ownerName: '',
      ownerEmail: '',
      version: 'v1.0.0',
      risk: 'low',
      status: 'connected',
    },
  });

  // Handle Sort
  const handleSort = (field: keyof Entity) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Handle Selection checkbox click
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedAssets.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    }
  };

  // Create Form Submit
  const handleCreateSubmit = async (values: AssetFormInput) => {
    try {
      await createMutation.mutateAsync({
        assetName: values.displayName,
        assetType: values.category,
        description: values.displayName,
        content: '',
        status: values.status,
        department: values.department,
        ownerName: values.ownerName,
        ownerEmail: values.ownerEmail,
        risk: values.risk,
        sourceApplication: values.sourceApplication,
      } as any);
      toast.success('Asset connected successfully!');
      setIsCreateOpen(false);
      form.reset();
      // Ensure list is fresh even if invalidation timing differs
      createMutation.reset();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create asset');
    }
  };

  // Edit Click & Submit
  const handleEditClick = (asset: Entity) => {
    setActiveAsset(asset);
    form.setValue('displayName', asset.displayName);
    form.setValue('name', asset.name);
    form.setValue('category', asset.category);
    form.setValue('sourceApplication', asset.sourceApplication);
    form.setValue('department', asset.department);
    form.setValue('ownerName', asset.owner.name);
    form.setValue('ownerEmail', asset.owner.email);
    form.setValue('version', asset.version);
    form.setValue('risk', asset.risk);
    form.setValue('status', asset.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: AssetFormInput) => {
    if (!activeAsset) return;
    
    const updatedActor: Actor = {
      ...activeAsset.owner,
      name: values.ownerName,
      email: values.ownerEmail,
    };

    try {
      await updateMutation.mutateAsync({
        id: activeAsset.id,
        data: {
          assetName: values.displayName,
          assetType: values.category,
          description: values.displayName,
          status: values.status,
          department: values.department,
          ownerName: values.ownerName,
          ownerEmail: values.ownerEmail,
          risk: values.risk,
          sourceApplication: values.sourceApplication,
        } as any,
      });
      toast.success('Asset updated successfully!');
      setIsEditOpen(false);
      setActiveAsset(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update asset');
    }
  };

  // Delete Click & Submit
  const handleDeleteClick = (asset: Entity) => {
    setActiveAsset(asset);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!activeAsset) return;
    try {
      await deleteMutation.mutateAsync(activeAsset.id);
      toast.success('Asset deleted successfully!');
      setIsDeleteOpen(false);
      setActiveAsset(null);
      setSelectedIds(selectedIds.filter((id) => id !== activeAsset.id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete asset');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    try {
      toast.loading('Deleting selected assets...', { id: 'bulk-del' });
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      toast.success('Selected assets deleted successfully!', { id: 'bulk-del' });
      setSelectedIds([]);
    } catch {
      toast.error('Bulk deletion failed', { id: 'bulk-del' });
    }
  };

  // Export selected / all to CSV
  const handleExportCSV = (exportSelected = false) => {
    const assetsToExport = exportSelected
      ? entities.filter((e) => selectedIds.includes(e.id))
      : filteredAssets;

    if (assetsToExport.length === 0) {
      toast.error('No assets available for export.');
      return;
    }

    const headers = ['Asset ID', 'Title', 'Record Key', 'Category', 'Source Application', 'Department', 'Owner Name', 'Owner Email', 'Status', 'Version', 'Risk', 'Record Count', 'Change Count', 'Last Changed'];
    const rows = assetsToExport.map((a) => [
      a.id,
      a.displayName,
      a.name,
      a.category,
      a.sourceApplication,
      a.department,
      a.owner.name,
      a.owner.email,
      a.status,
      a.version,
      a.risk,
      a.recordCount,
      a.changeCount,
      a.lastChangedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `protected_assets_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Successfully exported ${assetsToExport.length} assets to CSV!`);
  };

  // Simulated CSV Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const triggerImportSimulation = async () => {
    if (!importFile) {
      toast.error('Please select a CSV schema file to import.');
      return;
    }
    setIsImporting(true);
    setImportProgress(0);

    // Simulate progress ticks
    for (let p = 10; p <= 100; p += 15) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setImportProgress(Math.min(p, 100));
    }

    try {
      // Create a mock asset from file metadata
      const cleanName = importFile.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
      await createMutation.mutateAsync({
        name: cleanName,
        displayName: importFile.name.replace(/\.[^/.]+$/, ''),
        category: 'custom',
        sourceApplication: 'Imported CSV Upload',
        department: 'Operations',
        owner: { id: 'u-imp', name: 'System Auto-Import', email: 'audit@acme.com', role: 'System Admin' },
        status: 'connected',
        version: 'v1.0.0',
        risk: 'low',
        schema: [
          { key: 'id', label: 'Record ID', type: 'string', sensitive: false },
          { key: 'imported_value', label: 'Imported Field', type: 'string', sensitive: false },
        ],
      });

      toast.success(`Successfully connected asset "${importFile.name}"!`);
      setIsImportOpen(false);
      setImportFile(null);
    } catch {
      toast.error('Failed to import asset schema.');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets, owners, department…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Import */}
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV Schema
          </Button>

          {/* Export options */}
          <Button variant="outline" size="sm" onClick={() => handleExportCSV(false)}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          {/* Track Asset */}
          <Button size="sm" onClick={() => { form.reset(); setIsCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Asset
          </Button>
        </div>
      </div>

      {/* 2. Filters Row */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Advanced Filters:</span>
        </div>

        {/* Dept Filter */}
        <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Clinical Operations">Clinical Operations</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Compliance">Compliance</SelectItem>
            <SelectItem value="Human Resources">Human Resources</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="syncing">Syncing</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        {/* Risk Filter */}
        <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Selection Actions Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/25 px-4 py-3 text-sm text-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-accent">{selectedIds.length}</span>
              <span>assets selected for bulk updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-accent/20 hover:border-accent hover:bg-accent/5 text-accent"
                onClick={() => handleExportCSV(true)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Export Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Bulk Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Main Assets Data Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assets matching filters"
          description="Try modifying search keywords or switching workspace filters."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[40px] px-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 focus:ring-accent"
                      checked={selectedIds.length === paginatedAssets.length && paginatedAssets.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Asset ID</TableHead>
                  <TableHead className="text-2xs className cursor-pointer select-none" onClick={() => handleSort('displayName')}>
                    <span className="flex items-center gap-1">
                      Title
                      {sortBy === 'displayName' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </span>
                  </TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Record Type</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Department</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Owner</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Version</TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider">Risk</TableHead>
                  <TableHead className="text-2xs className cursor-pointer select-none" onClick={() => handleSort('lastChangedAt')}>
                    <span className="flex items-center gap-1">
                      Last Modified
                      {sortBy === 'lastChangedAt' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </span>
                  </TableHead>
                  <TableHead className="text-2xs uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.map((asset) => {
                  const isChecked = selectedIds.includes(asset.id);
                  return (
                    <TableRow
                      key={asset.id}
                      className={`hover:bg-muted/20 ${isChecked && 'bg-accent/5 hover:bg-accent/10'}`}
                    >
                      {/* Checkbox */}
                      <TableCell className="px-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 focus:ring-accent"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(asset.id, e.target.checked)}
                        />
                      </TableCell>

                      {/* Asset ID */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {asset.id}
                      </TableCell>

                      {/* Title */}
                      <TableCell className="font-medium text-foreground">
                        {asset.displayName}
                      </TableCell>

                      {/* Record Type / Category */}
                      <TableCell className="capitalize text-xs font-semibold text-muted-foreground">
                        {asset.category}
                      </TableCell>

                      {/* Department */}
                      <TableCell className="text-xs">
                        {asset.department}
                      </TableCell>

                      {/* Owner */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/10 text-primary text-3xs font-semibold">
                              {initials(asset.owner.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-none">
                            <span className="text-xs font-semibold">{asset.owner.name}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              asset.status === 'connected'
                                ? 'bg-success animate-pulse-soft'
                                : asset.status === 'syncing'
                                ? 'bg-accent animate-pulse-soft'
                                : asset.status === 'error'
                                ? 'bg-destructive animate-pulse-soft'
                                : 'bg-muted-foreground'
                            }`}
                          />
                          <span className="text-xs capitalize font-medium">{asset.status}</span>
                        </div>
                      </TableCell>

                      {/* Version */}
                      <TableCell className="font-mono text-xs">
                        {asset.version}
                      </TableCell>

                      {/* Risk */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-4xs font-bold px-1.5 capitalize py-0 ${
                            asset.risk === 'low'
                              ? 'border-success/30 bg-success/5 text-success'
                              : asset.risk === 'medium'
                              ? 'border-warning/30 bg-warning/5 text-warning'
                              : 'border-destructive/30 bg-destructive/5 text-destructive'
                          }`}
                        >
                          {asset.risk}
                        </Badge>
                      </TableCell>

                      {/* Last Modified */}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(asset.lastChangedAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setActiveAsset(asset); setIsDetailOpen(true); }}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditClick(asset)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {/* Version History */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.push(`/entities/versions?assetId=${asset.id}`)}
                            title="Version History"
                          >
                            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteClick(asset)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Show</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[70px] h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page &bull; Page {page} of {totalPages} &bull; {filteredAssets.length} total assets</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 5. Create Asset Dialog ===== */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Connect Database Asset</DialogTitle>
            <DialogDescription>
              Link a new enterprise schema or table data source into the cryptochain ledger.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Display Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Invoices Ledger" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Key</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. invoices_ledger" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="healthcare">Healthcare EHR</SelectItem>
                          <SelectItem value="banking">Banking Ledger</SelectItem>
                          <SelectItem value="education">Education Records</SelectItem>
                          <SelectItem value="insurance">Insurance Docs</SelectItem>
                          <SelectItem value="hrms">HR Employee Records</SelectItem>
                          <SelectItem value="custom">Custom Application</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceApplication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source System</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SAP Server" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Ownership</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Clinical Operations">Clinical Operations</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steward Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sarah Chen" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steward Email</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. s.chen@acme.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="v1.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="risk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Threat Risk</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Risk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="connected">Connected</SelectItem>
                          <SelectItem value="syncing">Syncing</SelectItem>
                          <SelectItem value="disconnected">Disconnected</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Connecting...' : 'Connect Database Asset'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== 6. Edit Asset Dialog ===== */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Database Asset</DialogTitle>
            <DialogDescription>
              Modify connection parameters or ownership attributes for this protected asset.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Display Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Invoices Ledger" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Key</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. invoices_ledger" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="healthcare">Healthcare EHR</SelectItem>
                          <SelectItem value="banking">Banking Ledger</SelectItem>
                          <SelectItem value="education">Education Records</SelectItem>
                          <SelectItem value="insurance">Insurance Docs</SelectItem>
                          <SelectItem value="hrms">HR Employee Records</SelectItem>
                          <SelectItem value="custom">Custom Application</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceApplication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source System</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SAP Server" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Ownership</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Clinical Operations">Clinical Operations</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Compliance">Compliance</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steward Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sarah Chen" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steward Email</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. s.chen@acme.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="v1.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="risk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Threat Risk</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Risk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="connected">Connected</SelectItem>
                          <SelectItem value="syncing">Syncing</SelectItem>
                          <SelectItem value="disconnected">Disconnected</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Settings'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== 7. Delete Confirmation Dialog ===== */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Protected Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect <strong className="text-foreground">{activeAsset?.displayName}</strong>? 
              This will pause real-time tamper evidence logging for this data source. All current hashes in the cryptochain ledger will remain read-only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSubmit}
            >
              Disconnect Asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== 8. Import CSV Schema Dialog ===== */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Import Asset Schema</DialogTitle>
            <DialogDescription>
              Upload a structured CSV file representing database tables and fields to immediately track updates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 bg-muted/10 text-center hover:bg-muted/20 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-xs font-semibold text-foreground">
                {importFile ? importFile.name : 'Select or drop CSV schema file'}
              </p>
              <p className="text-3xs text-muted-foreground mt-1">
                CSV files must map table headers to database variables
              </p>
            </div>

            {isImporting && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Importing schema components...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                  <div
                    className="h-full bg-accent transition-all duration-150"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={triggerImportSimulation} disabled={!importFile || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Import Schema'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 9. Asset Details Sheet (Drawer) ===== */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto bg-card border-l border-border shadow-md">
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">
                Protected Asset Details
              </span>
              <Badge
                variant="outline"
                className={`text-4xs font-bold px-1.5 capitalize py-0 ${
                  activeAsset?.risk === 'low'
                    ? 'border-success/30 bg-success/5 text-success'
                    : activeAsset?.risk === 'medium'
                    ? 'border-warning/30 bg-warning/5 text-warning'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                }`}
              >
                {activeAsset?.risk} Risk
              </Badge>
            </div>
            <SheetTitle className="text-xl font-bold mt-2">{activeAsset?.displayName}</SheetTitle>
            <SheetDescription className="font-mono text-2xs text-muted-foreground">
              Internal Key: {activeAsset?.name} &bull; ID: {activeAsset?.id}
            </SheetDescription>
          </SheetHeader>

          {activeAsset && (
            <div className="space-y-6 pt-6">
              {/* Connection Status card */}
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Connection Integrity</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        activeAsset.status === 'connected'
                          ? 'bg-success animate-pulse-soft'
                          : activeAsset.status === 'syncing'
                          ? 'bg-accent animate-pulse-soft'
                          : 'bg-destructive'
                      }`}
                    />
                    <span className="text-xs capitalize font-semibold">{activeAsset.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-background rounded-lg p-2 border">
                    <p className="text-3xs text-muted-foreground uppercase font-semibold">Records</p>
                    <p className="text-sm font-bold mt-0.5">{activeAsset.recordCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 border">
                    <p className="text-3xs text-muted-foreground uppercase font-semibold">Changes</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{activeAsset.changeCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 border">
                    <p className="text-3xs text-muted-foreground uppercase font-semibold">Version</p>
                    <p className="text-sm font-mono mt-0.5">{activeAsset.version}</p>
                  </div>
                </div>
              </div>

              {/* Metadata details */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Asset Infrastructure
                </h4>
                <div className="divide-y divide-border rounded-xl border bg-background text-sm">
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Source Application</span>
                    <span className="font-medium">{activeAsset.sourceApplication}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Ownership Department</span>
                    <span className="font-medium">{activeAsset.department}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Primary Administrator</span>
                    <span className="font-medium">{activeAsset.owner.name} ({activeAsset.owner.email})</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Linked Ledger Block</span>
                    <span className="font-mono text-xs text-muted-foreground">hash-chain-v1</span>
                  </div>
                </div>
              </div>

              {/* Schema Fields list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tracked Database Fields
                  </h4>
                  <span className="text-2xs text-muted-foreground">{activeAsset.schema.length} fields</span>
                </div>

                <div className="divide-y divide-border rounded-xl border bg-background overflow-hidden">
                  {activeAsset.schema.map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-3 hover:bg-muted/10">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{field.label}</span>
                        <code className="font-mono text-3xs text-muted-foreground">({field.key})</code>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-3xs font-mono py-0 font-normal">
                          {field.type}
                        </Badge>
                        {field.sensitive && (
                          <Badge variant="secondary" className="text-4xs font-bold gap-1 bg-warning/10 text-warning hover:bg-warning/15 border-transparent py-0">
                            <Lock className="h-2.5 w-2.5" />
                            SENSITIVE
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
