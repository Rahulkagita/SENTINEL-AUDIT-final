'use client';

/**
 * Social OAuth is NOT implemented by the SentinelAudit backend.
 *
 * This component is retained so existing imports keep compiling, but it
 * renders a disabled state and performs no authentication. It must not
 * imply that Google/Microsoft/GitHub sign-in works.
 */
interface SocialLoginsProps {
  redirectPath?: string;
}

const PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'github', label: 'GitHub' },
] as const;

export function SocialLogins(_props: SocialLoginsProps) {
  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-card px-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Social sign-in unavailable
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled
            aria-disabled
            title={`${provider.label} sign-in is not enabled for this deployment`}
            className="h-10 px-2 flex items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-xs font-medium text-muted-foreground opacity-60 cursor-not-allowed"
          >
            {provider.label}
          </button>
        ))}
      </div>

      <p className="text-center text-2xs text-muted-foreground">
        Enterprise email and password is the only supported sign-in method.
      </p>
    </div>
  );
}
