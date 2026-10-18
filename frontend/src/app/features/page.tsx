'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading, fadeUpVariant, staggerContainer } from '@/components/marketing/section-heading';
import { ProductScreenshot } from '@/components/marketing/product-screenshot';
import { MarketingCta } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FEATURE_CATEGORIES, HOW_IT_WORKS } from '@/content/marketing';

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_60%)]" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[80rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 pt-20 pb-12 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 gap-1.5 border-primary/30 bg-primary/5 py-1.5">
              <span className="text-xs font-semibold text-primary">Platform</span>
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              A complete platform for
              <span className="text-gradient"> change intelligence</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              From immutable recording to AI-powered anomaly detection, compliance reporting, and
              universal integration — SentinelAudit AI covers the entire change intelligence lifecycle.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto max-w-6xl px-6 pb-20"
        >
          <ProductScreenshot variant="dashboard" />
        </motion.div>
      </section>

      {/* Feature Categories */}
      {FEATURE_CATEGORIES.map((category, catIdx) => (
        <section
          key={category.title}
          className={catIdx % 2 === 1 ? 'border-y border-border bg-muted/20' : ''}
        >
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elevated">
                <category.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{category.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {category.features.length} capabilities in this category
                </p>
              </div>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {category.features.map((feature) => (
                <motion.div key={feature.title} variants={fadeUpVariant}>
                  <Card className="group h-full border-border/60 transition-all hover:border-primary/30 hover:shadow-elevated">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ))}

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="How It Works"
          title="From connection to compliance in four steps"
          description="No rip-and-replace. No code changes. SentinelAudit AI sits alongside your existing applications and starts recording changes immediately."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elevated">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="mt-4 block text-2xs font-bold uppercase tracking-wider text-primary">
                Step {step.step}
              </span>
              <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="relative border-y border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <SectionHeading
            eyebrow="Why SentinelAudit AI"
            title="Traditional audit logs vs. tamper-evident intelligence"
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/40">
              <div className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Capability
              </div>
              <div className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Traditional Logs
              </div>
              <div className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-primary">
                SentinelAudit AI
              </div>
            </div>
            {[
              { cap: 'Tamper-evident', trad: false, sent: true },
              { cap: 'Before/after diff', trad: false, sent: true },
              { cap: 'Version timeline', trad: false, sent: true },
              { cap: 'AI anomaly detection', trad: false, sent: true },
              { cap: 'Cryptographic proof', trad: false, sent: true },
              { cap: 'Real-time alerts', trad: 'Limited', sent: true },
              { cap: 'Compliance reports', trad: 'Manual', sent: true },
              { cap: 'Universal integration', trad: false, sent: true },
              { cap: 'Setup time', trad: 'Weeks', sent: 'Minutes' },
            ].map((row, i) => (
              <div
                key={row.cap}
                className={`grid grid-cols-3 divide-x divide-border ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
              >
                <div className="px-5 py-3 text-sm font-medium">{row.cap}</div>
                <div className="px-5 py-3 text-sm text-muted-foreground">
                  {row.trad === false ? (
                    <span className="text-destructive">—</span>
                  ) : (
                    row.trad
                  )}
                </div>
                <div className="px-5 py-3 text-sm">
                  {row.sent === true ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    row.sent
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingLayout>
  );
}
