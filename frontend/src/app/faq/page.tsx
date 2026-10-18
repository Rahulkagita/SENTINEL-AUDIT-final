'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { SectionHeading } from '@/components/marketing/section-heading';
import { MarketingCta } from '@/components/marketing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQS } from '@/content/marketing';

export default function FaqPage() {
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
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">FAQ</span>
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Frequently asked questions
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Everything you need to know about SentinelAudit AI — from integration and security
              to compliance and pricing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
            >
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="overflow-hidden rounded-xl border border-border bg-card px-5 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </section>

      {/* Contact prompts */}
      <section className="relative border-y border-border bg-muted/20">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <SectionHeading
            eyebrow="Still curious?"
            title="We are here to help"
            description="Our team is ready to answer any questions you have — whether it is about integration, security, or custom requirements."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex h-full flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Talk to our team</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Book a demo or get a personalized walkthrough of the platform.
                  </p>
                </div>
                <Button asChild className="mt-auto">
                  <Link href="/contact">
                    Contact sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex h-full flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Email support</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get answers from our support team within 24 hours.
                  </p>
                </div>
                <Button asChild variant="outline" className="mt-auto">
                  <Link href="/contact">
                    Send a message
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingLayout>
  );
}
