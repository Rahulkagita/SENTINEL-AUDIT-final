'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

interface BrandMarkProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

const sizeMap = {
  sm: { box: 'h-7 w-7', icon: 'h-4 w-4', text: 'text-base' },
  md: { box: 'h-9 w-9', icon: 'h-5 w-5', text: 'text-lg' },
  lg: { box: 'h-12 w-12', icon: 'h-7 w-7', text: 'text-2xl' },
};

export function BrandMark({ className, iconOnly = false, size = 'md', clickable = false }: BrandMarkProps) {
  const s = sizeMap[size];
  const { user } = useAuth();
  const href = user ? '/dashboard' : '/';

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elevated',
          s.box,
        )}
      >
        <ShieldCheck className={s.icon} strokeWidth={2.25} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
      </div>
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-semibold tracking-tight text-foreground', s.text)}>
            {APP_NAME}
          </span>
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
