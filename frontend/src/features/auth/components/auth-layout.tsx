'use client';

import { motion } from 'framer-motion';
import { Shield, Fingerprint, Lock, CheckCircle2 } from 'lucide-react';
import { BrandMark } from '@/components/common/brand-mark';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left side: Premium enterprise branding panel (hidden on mobile) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Background Decorative Grid and Blobs */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10">
          <BrandMark
            size="lg"
            className="[&_span]:text-sidebar-foreground [&_.bg-gradient-to-br]:from-accent [&_.bg-gradient-to-br]:to-primary"
          />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <h1 className="text-3xl font-bold tracking-tight text-sidebar-foreground">
              {APP_TAGLINE}
            </h1>
            <p className="text-sm text-sidebar-foreground/75 leading-relaxed">
              Cryptographically secure, AI-powered transaction logs that satisfy compliance audits and detect insider threat anomalies instantly.
            </p>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            }}
            className="space-y-3.5"
          >
            {[
              { icon: Shield, text: 'Cryptographic hash-linked ledger blocks' },
              { icon: Fingerprint, text: 'Detailed, identity-anchored audit trails' },
              { icon: Lock, text: 'HIPAA, SOC2, and GDPR compliant designs' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="flex items-center gap-3 text-sm text-sidebar-foreground/80"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-accent/20 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{item.text}</span>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>

        <div className="relative z-10 flex items-center gap-2 rounded-xl bg-sidebar-foreground/5 p-4 border border-sidebar-border max-w-sm">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          <p className="text-xs text-sidebar-foreground/70">
            All database modifications hashed and verified. Over <span className="font-semibold text-accent">34,000+ logs</span> checked.
          </p>
        </div>
      </div>

      {/* Right side: Authentication Form Card */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8 bg-background relative">
        {/* Decorative elements for mobile screens */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_60%)] lg:hidden" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl lg:hidden" />

        <div className="mx-auto w-full max-w-md z-10">
          <div className="flex flex-col space-y-2 text-center lg:text-left mb-8">
            {/* Brand icon for mobile screens */}
            <div className="flex justify-center lg:hidden mb-6">
              <BrandMark size="md" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm sm:p-8 relative"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
