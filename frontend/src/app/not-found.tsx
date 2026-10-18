'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elevated">
        <ShieldCheck className="h-8 w-8" />
      </div>
      <h1 className="mt-8 text-6xl font-semibold tracking-tight">404</h1>
      <p className="mt-4 max-w-md text-balance text-muted-foreground">
        The page you are looking for could not be found. It may have been moved, deleted, or never
        existed.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </div>
  );
}
