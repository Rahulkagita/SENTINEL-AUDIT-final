'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  GitBranch,
  Lock,
  Plug,
  ScanSearch,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading, fadeUpVariant, staggerContainer } from '@/components/marketing/section-heading';
import { ProductScreenshot } from '@/components/marketing/product-screenshot';
import { MarketingCta } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  HERO_HEADLINE,
  HERO_SUBHEAD,
  STATS,
  FEATURES,
  HOW_IT_WORKS,
  INDUSTRIES,
  TIMELINE_MILESTONES,
} from '@/content/marketing';
import { APP_NAME } from '@/lib/constants';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <MarketingLayout>
      {/* ===== Hero ===== */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_60%)]" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[40rem] w-[80rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/4 -left-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-40 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto max-w-5xl px-6 pt-20 pb-12 text-center sm:pt-32"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-8 gap-1.5 border-primary/30 bg-primary/5 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                AI-Assisted Change Intelligence Platform
              </span>
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Every Change. Every Version.
            <br />
            <span className="text-gradient">Every Record. Protected.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
          >
            {HERO_SUBHEAD}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/contact">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <Link href="/features">See how it works</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {[
              { icon: Lock, label: 'Tamper-evident' },
              { icon: Fingerprint, label: 'Cryptographic chain' },
              { icon: ShieldCheck, label: 'Compliance-ready' },
              { icon: Zap, label: 'Setup in minutes' },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <t.icon className="h-3.5 w-3.5 text-primary" />
                {t.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto max-w-6xl px-6 pb-20"
        >
          <div className="pointer-events-none absolute -inset-x-20 -top-10 -bottom-10 bg-gradient-to-b from-accent/5 via-transparent to-transparent blur-2xl" />
          <div className="relative">
            <ProductScreenshot variant="dashboard" />
          </div>
        </motion.div>
      </section>

      {/* ===== Stats ===== */}
      <section className="relative border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-8 lg:grid-cols-4"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={fadeUpVariant} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="Platform Capabilities"
          title="Everything you need to prove integrity"
          description="From immutable recording to AI-powered anomaly detection — SentinelAudit AI gives you complete visibility and provable trust across every connected system."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={fadeUpVariant}>
              <Card className="group h-full border-border/60 transition-all hover:border-primary/30 hover:shadow-elevated">
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary transition-transform group-hover:scale-110">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="relative overflow-hidden border-y border-border bg-muted/20">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="How It Works"
            title="From connection to compliance in four steps"
            description="No rip-and-replace. No code changes. SentinelAudit AI sits alongside your existing applications and starts recording changes immediately."
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative"
              >
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-12 top-12 hidden h-px w-full bg-gradient-to-r from-border to-transparent lg:block" />
                )}
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elevated">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-2xs font-bold text-muted-foreground ring-1 ring-border">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Product screenshots row */}
          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <ProductScreenshot variant="audit-log" />
              <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                Immutable audit trail
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ProductScreenshot variant="timeline" />
              <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                Version timeline
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ProductScreenshot variant="anomaly" />
              <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                AI anomaly detection
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Industries ===== */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="Universal by Design"
          title="Built for every industry with sensitive data"
          description="SentinelAudit AI is not built for one vertical. It is a generic platform that works across any application — from hospitals to banks, universities to government agencies."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {INDUSTRIES.slice(0, 6).map((industry) => (
            <motion.div key={industry.name} variants={fadeUpVariant}>
              <Card className="group h-full overflow-hidden border-border/60 transition-all hover:border-primary/30 hover:shadow-elevated">
                <div className={`relative h-24 bg-gradient-to-br ${industry.accent}`}>
                  <div className="absolute inset-0 bg-grid opacity-20" />
                  <industry.icon className="absolute bottom-3 right-4 h-10 w-10 text-foreground/70 transition-transform group-hover:scale-110" />
                </div>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-base font-semibold">{industry.name}</h3>
                  <p className="text-sm text-muted-foreground">{industry.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {industry.examples.map((ex) => (
                      <span
                        key={ex}
                        className="rounded-md bg-muted px-2 py-0.5 text-2xs font-medium text-muted-foreground"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/industries">
              See all industries
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ===== Timeline Animation ===== */}
      <section className="relative overflow-hidden border-y border-border bg-muted/20">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-24">
          <SectionHeading
            eyebrow="Our Journey"
            title="From a simple idea to a universal platform"
          />

          <div className="relative mt-16">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
            {TIMELINE_MILESTONES.map((milestone, i) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative mb-12 last:mb-0 pl-16"
              >
                <div className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elevated">
                  <milestone.icon className="h-5 w-5" />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <span className="text-sm font-bold text-primary">{milestone.year}</span>
                  <h3 className="mt-1 text-lg font-semibold">{milestone.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Feature Highlight: Audit Trail ===== */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-primary">
              Tamper-Evident Chain
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Like Git for enterprise data — but designed for non-developers
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every change is hash-linked to the previous one, creating a cryptographic chain
              that is impossible to tamper with undetectably. If anyone modifies a record, the
              chain breaks and SentinelAudit AI flags it instantly.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'SHA-256 cryptographic hashing on every entry',
                'Each entry references the previous entry\'s hash',
                'Any modification breaks the chain visibly',
                'Mathematically provable integrity — not just a log file',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/features">
                  Explore the platform
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ProductScreenshot variant="audit-log" />
          </motion.div>
        </div>
      </section>

      {/* ===== Feature Highlight: AI ===== */}
      <section className="relative overflow-hidden border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-2 lg:order-1"
            >
              <ProductScreenshot variant="anomaly" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="order-1 lg:order-2"
            >
              <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-primary">
                AI Anomaly Engine
              </span>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                From passive logging to active intelligence
              </h2>
              <p className="mt-4 text-muted-foreground">
                Traditional audit logs sit there until someone reads them. SentinelAudit AI
                continuously analyzes change patterns, learning what normal looks like for each
                actor, entity, and field — then flags the unusual automatically.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Behavioral baselines per actor and entity',
                  'Off-hours, bulk edit, and sensitive field detection',
                  'Confidence scores for fast triage',
                  'Smart alerts routed to Slack, email, or PagerDuty',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <MarketingCta />
    </MarketingLayout>
  );
}
