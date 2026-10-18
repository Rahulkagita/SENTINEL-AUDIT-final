'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading, fadeUpVariant, staggerContainer } from '@/components/marketing/section-heading';
import { MarketingCta } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TIMELINE_MILESTONES, VALUES, TEAM, STATS } from '@/content/marketing';
import { APP_NAME } from '@/lib/constants';
import { getInitialsColor } from '@/lib/format';

export default function AboutPage() {
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
              <span className="text-xs font-semibold text-primary">Our Story</span>
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              We believe every change
              <span className="text-gradient"> should be provable</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              {APP_NAME} was born from a simple observation: organizations spend millions on
              compliance, yet cannot answer the most basic question — who changed what, when, and
              why? We set out to fix that.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <SectionHeading
          eyebrow="Our Mission"
          title="Make trust provable for every organization"
          description="In a world of increasing regulation, data breaches, and insider threats, trust is no longer enough. You need proof. SentinelAudit AI makes integrity provable — not just claimed."
        />
        <div className="mt-12 rounded-2xl border border-border bg-card p-8">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            &ldquo;We started SentinelAudit AI after seeing the same problem in every industry: audit
            logs that could be edited, compliance reports that took weeks, and no way to prove data
            integrity after the fact. We realized the technology existed — cryptographic hashing,
            Git-style versioning, AI anomaly detection — but no one had packaged it for the
            enterprise. So we did.&rdquo;
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            — Aarav Mehta, Co-founder & CEO
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="relative border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="Our Values"
            title="What we stand for"
            description="The principles that guide every decision we make — from product design to customer support."
          />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {VALUES.map((value) => (
              <motion.div key={value.title} variants={fadeUpVariant}>
                <Card className="h-full border-border/60 transition-all hover:border-primary/30 hover:shadow-elevated">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
                      <value.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <SectionHeading
          eyebrow="Our Journey"
          title="From idea to universal platform"
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
      </section>

      {/* Team */}
      <section className="relative border-y border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="Our Team"
            title="The people behind SentinelAudit AI"
            description="A team of security engineers, compliance experts, and AI researchers on a mission to make data integrity provable."
          />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {TEAM.map((member) => (
              <motion.div key={member.name} variants={fadeUpVariant}>
                <Card className="group h-full border-border/60 transition-all hover:border-primary/30 hover:shadow-elevated">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold ${getInitialsColor(member.name)}`}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">{member.name}</h3>
                        <p className="text-sm text-primary">{member.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <MarketingCta />
    </MarketingLayout>
  );
}
