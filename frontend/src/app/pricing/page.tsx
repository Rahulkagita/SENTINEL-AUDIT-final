'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Zap, ShieldCheck, Building2 } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading, fadeUpVariant, staggerContainer } from '@/components/marketing/section-heading';
import { MarketingCta } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRICING } from '@/content/marketing';
import { cn } from '@/lib/utils';

export default function PricingPage() {
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
              <span className="text-xs font-semibold text-primary">Pricing</span>
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Start free for 14 days. No credit card required. Scale as you grow — from a single
              team to a global enterprise.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {PRICING.map((plan) => (
            <motion.div key={plan.name} variants={fadeUpVariant}>
              <Card
                className={cn(
                  'relative h-full overflow-hidden transition-all',
                  plan.highlighted
                    ? 'border-primary shadow-elevated ring-1 ring-primary/20'
                    : 'border-border/60 hover:border-primary/30 hover:shadow-elevated',
                )}
              >
                {plan.highlighted && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
                )}
                {plan.highlighted && (
                  <div className="absolute right-4 top-4">
                    <Badge className="gap-1 bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3" /> Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="space-y-6 p-6">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    {plan.price !== null ? (
                      <>
                        <span className="text-4xl font-semibold tracking-tight tabular-nums">
                          ${plan.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-semibold tracking-tight">Custom</span>
                    )}
                  </div>

                  <Button
                    asChild
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    <Link href="/contact">
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <div className="space-y-3 pt-2">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                      What&apos;s included
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Comparison */}
      <section className="relative border-y border-border bg-muted/20">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <SectionHeading
            eyebrow="Compare Plans"
            title="Everything you get with SentinelAudit AI"
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-4 divide-x divide-border border-b border-border bg-muted/40">
              <div className="px-5 py-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Feature
              </div>
              <div className="px-5 py-3 text-center text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Starter
              </div>
              <div className="px-5 py-3 text-center text-2xs font-semibold uppercase tracking-wider text-primary">
                Professional
              </div>
              <div className="px-5 py-3 text-center text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enterprise
              </div>
            </div>
            {[
              { feature: 'Changes / month', values: ['50K', '500K', 'Unlimited'] },
              { feature: 'Connected apps', values: ['3', '15', 'Unlimited'] },
              { feature: 'Audit retention', values: ['30 days', '1 year', 'Unlimited'] },
              { feature: 'AI anomaly detection', values: [true, true, true] },
              { feature: 'Real-time alerts', values: ['Email', 'All channels', 'All channels'] },
              { feature: 'Compliance reports', values: ['CSV', 'SOC 2 + GDPR', 'Custom'] },
              { feature: 'API access', values: [false, true, true] },
              { feature: 'On-premise option', values: [false, false, true] },
              { feature: 'Dedicated support', values: [false, 'Priority', '24/7 + DSM'] },
            ].map((row, i) => (
              <div
                key={row.feature}
                className={cn(
                  'grid grid-cols-4 divide-x divide-border',
                  i % 2 === 1 && 'bg-muted/20',
                )}
              >
                <div className="px-5 py-3 text-sm font-medium">{row.feature}</div>
                {row.values.map((val, j) => (
                  <div key={j} className="px-5 py-3 text-center text-sm">
                    {val === true ? (
                      <Check className="mx-auto h-4 w-4 text-success" />
                    ) : val === false ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-muted-foreground">{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <SectionHeading
          eyebrow="Still have questions?"
          title="We have answers"
          description="Check out our FAQ for everything you need to know about pricing, features, and deployment."
        />
        <div className="mt-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/faq">
              Read the FAQ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MarketingCta />
    </MarketingLayout>
  );
}
