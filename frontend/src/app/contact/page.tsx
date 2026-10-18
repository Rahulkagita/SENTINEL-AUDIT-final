'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
} from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CONTACT_METHODS } from '@/content/marketing';
import { sleep } from '@/lib/format';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  workEmail: z.string().email('Enter a valid email address'),
  company: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  teamSize: z.string().min(1, 'Please select a team size'),
  message: z.string().min(10, 'Please tell us a bit more (at least 10 characters)'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const industries = [
  'Healthcare',
  'Banking & Finance',
  'Education',
  'Government',
  'Legal',
  'Insurance',
  'Enterprise / ERP',
  'HRMS',
  'CRM',
  'Other',
];

const teamSizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      workEmail: '',
      company: '',
      industry: '',
      teamSize: '',
      message: '',
    },
  });

  async function onSubmit(_values: ContactFormValues) {
    await sleep(1000);
    setSubmitted(true);
  }

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
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Contact</span>
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s talk about your
              <span className="text-gradient"> audit needs</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Whether you are evaluating SentinelAudit AI for compliance, investigating a specific
              use case, or ready to start a free trial — our team is here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact form + info */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">Thank you!</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      Your message has been received. Our team will get back to you within 24 hours.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-6"
                    >
                      <Link href="/">
                        Back to home
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold">Get in touch</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fill out the form below and we will respond within 24 hours.
                    </p>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="mt-6 space-y-4"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Sarah" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Chen" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="workEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="sarah@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Corporation" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="industry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Industry</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {industries.map((ind) => (
                                      <SelectItem key={ind} value={ind}>
                                        {ind}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="teamSize"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Team size</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {teamSizes.map((size) => (
                                      <SelectItem key={size} value={size}>
                                        {size}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How can we help?</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about your audit and compliance needs..."
                                  className="min-h-[120px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          disabled={form.formState.isSubmitting}
                        >
                          {form.formState.isSubmitting ? (
                            <>Sending...</>
                          ) : (
                            <>
                              Send message
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold">Contact details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Prefer to reach out directly? Here is how.
              </p>
              <div className="mt-5 space-y-4">
                {CONTACT_METHODS.map((method) => (
                  <div key={method.label} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <method.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {method.label}
                      </p>
                      <p className="text-sm font-medium">{method.value}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm font-medium">hello@sentinelaudit.ai</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-success/20 bg-success/5 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold">14-day free trial</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Want to explore on your own? Start a free trial — no credit card required, no
                commitment. Connect your first app in minutes.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href="/pricing">
                  See pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-6">
              <h3 className="text-sm font-semibold">What to expect</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                {[
                  'Response within 24 hours',
                  'Personalized demo of the platform',
                  'Integration guidance for your stack',
                  'No pressure, no commitment',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
