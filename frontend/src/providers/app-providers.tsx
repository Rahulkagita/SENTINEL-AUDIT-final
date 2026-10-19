'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query-client';

import { AuthProvider } from '@/providers/auth-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
        {/* React Query Devtools were removed from the user-facing UI on purpose;
            QueryClientProvider (and all React Query behaviour) stays untouched. */}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
