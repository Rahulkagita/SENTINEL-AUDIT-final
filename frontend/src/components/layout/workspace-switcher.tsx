'use client';

import { useWorkspace } from '@/hooks/use-workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Layers, 
  HeartPulse, 
  Landmark, 
  GraduationCap, 
  Building, 
  Briefcase, 
  ShieldAlert, 
  Umbrella, 
  Settings, 
  Gavel,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Map workspace icons
const iconMap: Record<string, any> = {
  healthcare: HeartPulse,
  banking: Landmark,
  education: GraduationCap,
  government: Building,
  enterprise: Briefcase,
  police: ShieldAlert,
  insurance: Umbrella,
  manufacturing: Settings,
  legal: Gavel,
};

export function WorkspaceSwitcher() {
  const { activeWorkspace, setActiveWorkspace, workspaces } = useWorkspace();
  const Icon = iconMap[activeWorkspace.id] || Layers;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-left text-foreground transition-all hover:bg-muted/80 focus:outline-none focus:ring-1 focus:ring-ring select-none max-w-[240px]">
          {/* Logo Box */}
          <div
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded text-white shadow-sm font-semibold',
              activeWorkspace.color
            )}
          >
            <Icon className="h-3 w-3" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 leading-none pr-1">
            <p className="text-2xs font-semibold truncate leading-none">{activeWorkspace.name}</p>
          </div>

          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-72 z-50 bg-card border border-border shadow-lg p-1.5">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
          Switch Organization Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1.5" />
        
        <div className="max-h-[320px] overflow-y-auto pr-1">
          {workspaces.map((ws) => {
            const WsIcon = iconMap[ws.id] || Layers;
            const isSelected = ws.id === activeWorkspace.id;

            return (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setActiveWorkspace(ws)}
                className={cn(
                  'flex items-start gap-3 p-2 cursor-pointer rounded-md transition-colors my-0.5',
                  isSelected ? 'bg-primary/5 text-primary font-medium' : 'hover:bg-muted'
                )}
              >
                {/* Mini Icon */}
                <div
                  className={cn(
                    'flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded text-white mt-0.5',
                    ws.color
                  )}
                >
                  <WsIcon className="h-3.5 w-3.5" />
                </div>

                {/* Text metadata */}
                <div className="flex-1 min-w-0 leading-none">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold truncate">{ws.name}</p>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                  </div>
                  <p className="mt-1 text-3xs text-muted-foreground leading-normal line-clamp-2">
                    {ws.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
