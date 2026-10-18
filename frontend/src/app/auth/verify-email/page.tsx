'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { Button } from '@/components/ui/button';

/**
 * Email verification is NOT implemented by the SentinelAudit backend.
 * This page is a placeholder so the route does not imply a working flow.
 */
export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Email verification unavailable"
      subtitle="Email verification is not enabled for this deployment"
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <BadgeCheck className="h-7 w-7 text-muted-foreground" />
        </div>

        <p className="text-sm text-muted-foreground">
          Accounts are active immediately after registration. No verification
          step is required.
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
