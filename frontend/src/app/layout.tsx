import './globals.css';
import type { Metadata } from 'next';
import { AppProviders } from '@/providers/app-providers';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

export const metadata: Metadata = {
  // Without an explicit base, Next.js falls back to http://localhost:3000 for
  // resolving social images in production. Point it at the real deployment
  // origin via NEXT_PUBLIC_SITE_URL when deploying.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: `${APP_NAME} — Audit Trail & Version History`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME }],
  keywords: ['audit trail', 'change log', 'version history', 'data governance'],
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
