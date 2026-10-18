'use client';

import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { Button } from '@/components/ui/button';

/**
 * Password reset is NOT implemented by the SentinelAudit backend.
 * This page is a placeholder so the route does not imply a working flow.
 */
export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Password reset unavailable"
      subtitle="Self-service password reset is not enabled for this deployment"
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <KeyRound className="h-7 w-7 text-muted-foreground" />
        </div>

        <p className="text-sm text-muted-foreground">
          Contact your SentinelAudit administrator to reset your credentials.
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
