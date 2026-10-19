import { type LucideIcon } from 'lucide-react';
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ChangeOperation } from '@/types';

type IconMap<T extends string> = Record<T, LucideIcon>;

const operationIcons: IconMap<ChangeOperation> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  RESTORE: RotateCcw,
};

export const iconRegistry = {
  operation: operationIcons,
} as const;
