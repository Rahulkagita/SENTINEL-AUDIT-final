'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SessionLoader } from '@/features/auth/components/session-loader';

export default function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show a full-screen loader while loading, or if the user is already signed in (during redirect transition)
  if (isLoading || user) {
    return <SessionLoader />;
  }

  return <>{children}</>;
}
