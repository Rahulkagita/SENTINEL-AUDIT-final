'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { AssistantChat } from './assistant-chat';

const PANEL_ID = 'sentinel-audit-ai-panel';
const ASSISTANT_NAME = 'SentinelAudit AI';

/**
 * Global floating assistant.
 *
 * Mounted once in the shared authenticated `AppShell`, so it is available on
 * every protected page (and never on the auth pages, which do not use the
 * shell). The panel reuses `AssistantChat` — the same component, hooks and API
 * client that back the standalone `/assistant` page — so there is exactly one
 * chatbot implementation.
 */
export function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  // Escape collapses the panel for keyboard users.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      {/*
        Panel anchored to the right edge of the viewport. Full width on small
        screens (so it stays usable), docked to a 440px column from sm up.
        z-40 keeps it above the page content and sticky topbar (z-30) while
        still leaving dialogs/dropdowns (z-50) and toasts (z-100) on top.
      */}
      <section
        id={PANEL_ID}
        aria-label={ASSISTANT_NAME}
        aria-hidden={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-full flex-col border-l border-border bg-background shadow-2xl',
          open ? 'flex' : 'hidden',
        )}
      >
        <AssistantChat
          variant="floating"
          title={ASSISTANT_NAME}
          description={null}
          onClose={() => setOpen(false)}
          className="h-full"
        />
      </section>

      {/*
        Floating trigger. It stays mounted for the panel's lifetime; while the
        panel is open it slides to the panel's left edge on sm+ screens (the
        panel is full-width below sm, so there is no room for it there).
      */}
      <Button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? `Hide ${ASSISTANT_NAME}` : `Open ${ASSISTANT_NAME}`}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        className={cn(
          'fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full shadow-lg transition-all',
          'hover:shadow-elevated',
          open && 'hidden sm:inline-flex sm:right-[456px]',
        )}
      >
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </Button>
    </>
  );
}
