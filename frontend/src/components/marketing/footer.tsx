'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Github,
  Linkedin,
  Twitter,
  ShieldCheck,
} from 'lucide-react';
import { BrandMark } from '@/components/common/brand-mark';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { FOOTER_SECTIONS } from '@/content/marketing';

const socials = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
];

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[80rem] -translate-x-1/2 rounded-full bg-gradient-to-t from-primary/10 via-accent/5 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_3fr]">
          <div className="space-y-5">
            <BrandMark size="md" />
            <p className="max-w-xs text-sm text-muted-foreground">
              Universal tamper-evident change intelligence for every enterprise application.
              Every change. Every version. Every record. Protected.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">
                SOC 2 Type II · ISO 27001 · GDPR compliant
              </span>
            </div>
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Link href="/contact">
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MarketingCta() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-10 text-center sm:p-16"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Start proving integrity in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Connect your first application and see every change recorded in a tamper-evident chain.
            Free for 14 days — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contact">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/features">Explore features</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
