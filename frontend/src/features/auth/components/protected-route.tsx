'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SessionLoader } from './session-loader';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      // Encode redirect URL if needed, or simply redirect to /auth/login
      const redirectUrl = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/auth/login${redirectUrl}`);
    }
  }, [user, isLoading, router, pathname]);

  // Show session loading page if loading state is active
  if (isLoading) {
    return <SessionLoader />;
  }

  // If loading has finished but user is still null, do not render children to prevent flash of content
  if (!user) {
    return <SessionLoader />;
  }

  // Render children once authenticated
  return <>{children}</>;
}
