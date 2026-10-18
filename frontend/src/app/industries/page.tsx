'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading, fadeUpVariant, staggerContainer } from '@/components/marketing/section-heading';
import { MarketingCta } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { INDUSTRIES } from '@/content/marketing';

export default function IndustriesPage() {
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
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Universal by Design</span>
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              One platform for
              <span className="text-gradient"> every industry</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              SentinelAudit AI is not built for one vertical. It is a generic, tamper-evident
              change intelligence platform that works across any application containing
              critical information — from hospitals to banks, universities to government agencies.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {INDUSTRIES.map((industry) => (
            <motion.div key={industry.name} variants={fadeUpVariant}>
              <Card className="group h-full overflow-hidden border-border/60 transition-all hover:border-primary/30 hover:shadow-elevated">
                <div className={`relative h-28 bg-gradient-to-br ${industry.accent}`}>
                  <div className="absolute inset-0 bg-grid opacity-20" />
                  <industry.icon className="absolute bottom-3 right-4 h-12 w-12 text-foreground/70 transition-transform group-hover:scale-110" />
                  <div className="absolute left-4 top-4">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-foreground/60">
                      Industry
                    </span>
                  </div>
                </div>
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold">{industry.name}</h3>
                  <p className="text-sm text-muted-foreground">{industry.description}</p>
                  <div className="space-y-2">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Common use cases
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {industry.examples.map((ex) => (
                        <span
                          key={ex}
                          className="rounded-md bg-muted px-2 py-1 text-2xs font-medium text-muted-foreground"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Use Case Spotlight */}
      <section className="relative border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="Real-World Scenarios"
            title="How organizations use SentinelAudit AI"
            description="The same platform. Different industries. Same tamper-evident integrity."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                industry: 'Healthcare',
                scenario: 'A hospital network tracks every change to patient records across 12 EHR systems. When an off-hours edit to a diagnosis code is flagged by AI, compliance teams investigate within minutes — not months.',
                metric: '12 EHR systems',
                metricLabel: 'unified under one audit chain',
              },
              {
                industry: 'Banking',
                scenario: 'A regional bank monitors all account balance modifications in real time. When the AI detects a bulk update pattern inconsistent with normal teller activity, it alerts the fraud team instantly.',
                metric: '99.99%',
                metricLabel: 'chain integrity verified',
              },
              {
                industry: 'Education',
                scenario: 'A university tracks every grade change across its SIS. When a professor modifies grades for students outside their course roster, the anomaly engine flags it for the registrar.',
                metric: '30 min',
                metricLabel: 'from connection to first audit entry',
              },
            ].map((spotlight, i) => (
              <motion.div
                key={spotlight.industry}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-4 p-6">
                    <Badge variant="secondary" className="text-2xs font-semibold">
                      {spotlight.industry}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{spotlight.scenario}</p>
                    <div className="border-t border-border pt-4">
                      <p className="text-2xl font-semibold text-primary">{spotlight.metric}</p>
                      <p className="text-xs text-muted-foreground">{spotlight.metricLabel}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Generic */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <SectionHeading
          eyebrow="Why Generic Wins"
          title="Not a vertical-specific tool. A platform."
          description="Vertical-specific audit tools lock you into one industry's data model. SentinelAudit AI adapts to any schema, any workflow, any compliance framework — so it grows with you."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[
            'Adapts to any data schema — define your own entities and fields',
            'Works with any compliance framework — SOX, HIPAA, GDPR, SOC 2, ISO 27001, PCI DSS',
            'Integrates with any application via REST, webhook, or SDK',
            'Scales from a single team to a global enterprise without re-platforming',
            'No vendor lock-in — export your data anytime',
            'One platform for all your audit needs, today and tomorrow',
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-4"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span className="text-sm">{item}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <MarketingCta />
    </MarketingLayout>
  );
}
