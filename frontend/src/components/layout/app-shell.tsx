'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { FloatingAssistant } from '@/features/assistant/components/floating-assistant';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto w-full max-w-[1600px] px-6 py-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      {/* Global assistant: every authenticated page that renders the shell gets
          the same floating entry point. ProtectedRoute guarantees it never
          renders for signed-out visitors (login/register/etc.). */}
      <FloatingAssistant />
    </ProtectedRoute>
  );
}
