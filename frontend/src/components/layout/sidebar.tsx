'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  GitBranch,
  LayoutDashboard,
  Plug,
  ScanSearch,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/common/brand-mark';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { APP_NAME } from '@/lib/constants';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview & metrics' },
  { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, description: 'Immutable change trail' },
  { label: 'Protected Assets', href: '/entities', icon: Database, description: 'Tracked data sources' },
  { label: 'Audit Timeline', href: '/timelines', icon: GitBranch, description: 'Version history' },
  { label: 'Anomalies', href: '/anomalies', icon: ScanSearch, description: 'AI-detected signals' },
  { label: 'Integrations', href: '/integrations', icon: Plug, description: 'Connected systems' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <BrandMark clickable={true} />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Workspace
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/60',
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-sidebar-accent-foreground" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-3 pb-2 text-2xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          System
        </p>
        <ul className="space-y-1">
          <li>
            <Link
              href="/settings"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-all hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
            >
              <Settings className="h-4 w-4 shrink-0 text-sidebar-foreground/60 transition-transform group-hover:scale-110" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/dashboard"
          className="block rounded-lg bg-sidebar-foreground/5 p-3 transition-opacity hover:opacity-80"
        >
          <p className="text-2xs font-medium text-sidebar-foreground/80">{APP_NAME}</p>
          <p className="mt-0.5 text-2xs text-sidebar-foreground/50">Tamper-evident audit v1.0</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
            <span className="text-2xs text-sidebar-foreground/60">All systems operational</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
