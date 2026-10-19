'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { initials, getInitialsColor } from '@/lib/format';
import { APP_NAME, APP_VERSION } from '@/lib/constants';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Your account, as recorded by the backend, and local appearance preferences."
      />

      <div className="mt-4 max-w-2xl space-y-4">
        {/* Profile — real data from GET /api/auth/me */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Fetched from the backend /auth/me endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={getInitialsColor(user.name)}>
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-2xs uppercase tracking-wider text-muted-foreground">
                    Role: {user.role}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No signed-in user. Sign in to see your profile.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Appearance — local preference only */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>
              Theme preference is stored locally in your browser and sent nowhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!mounted ? (
              <div className="h-9 w-28 animate-pulse rounded bg-muted" />
            ) : (
              <div className="flex gap-2">
                {themeOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={theme === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(opt.value)}
                  >
                    <opt.icon className="mr-2 h-4 w-4" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>
              Sign out clears the locally stored access token and returns you to the sign-in page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {APP_NAME} v{APP_VERSION}
            </p>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
