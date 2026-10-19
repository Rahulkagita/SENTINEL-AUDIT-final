'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

const STORAGE_KEY_TOKEN = 'sentinel_audit_token';

/**
 * Landing page.
 *
 * Authenticated users are redirected to the dashboard. Unauthenticated
 * visitors see a minimal sign-in entry point — no marketing copy, no
 * fabricated metrics or screenshots.
 */
export default function LandingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'signedOut'>('checking');

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (token) {
      router.replace('/dashboard');
    } else {
      setStatus('signedOut');
    }
  }, [router]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{APP_TAGLINE}</p>

        <div className="mt-8 space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/auth/login">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/auth/register">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
