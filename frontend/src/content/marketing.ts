import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertOctagon,
  Bell,
  Boxes,
  Building2,
  Database,
  Eye,
  Fingerprint,
  GitBranch,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Lock,
  Plug,
  ScanSearch,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Clock,
  FileCheck,
  KeyRound,
  Network,
  Layers,
  Search,
  Download,
  Building,
  Scale,
  Briefcase,
} from 'lucide-react';

export const HERO_HEADLINE = 'Every Change. Every Version. Every Record. Protected.';
export const HERO_SUBHEAD =
  'SentinelAudit AI is a universal tamper-evident audit and version intelligence platform that records, verifies and analyzes every critical data change across enterprise applications.';

export const STATS = [
  { value: '2.4B+', label: 'Changes tracked', icon: Activity },
  { value: '99.99%', label: 'Chain integrity', icon: ShieldCheck },
  { value: '180+', label: 'Integrations', icon: Plug },
  { value: '<50ms', label: 'Audit lookup', icon: Zap },
];

export const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: ScrollText,
    title: 'Immutable Audit Trail',
    description:
      'Every create, update, and delete is recorded in a cryptographically linked chain. Any tampering breaks the chain and is instantly detectable.',
  },
  {
    icon: GitBranch,
    title: 'Version History',
    description:
      'Full before/after comparison and timeline for any record. Roll back to any prior state and trace exactly who changed what, when, and why.',
  },
  {
    icon: ScanSearch,
    title: 'AI Anomaly Detection',
    description:
      'Statistical and behavioral signals flag suspicious changes automatically — off-hours edits, bulk modifications, privileged account abuse, and more.',
  },
  {
    icon: Plug,
    title: 'Universal Integration',
    description:
      'Connect any business application via REST, webhook, or SDK. Works with ERPs, CRMs, HRMS, EHRs, core banking, SIS, and custom systems.',
  },
  {
    icon: Fingerprint,
    title: 'Cryptographic Proof',
    description:
      'Each entry is hash-linked to the previous one, creating a tamper-evident chain inspired by Git and blockchain principles — without the complexity.',
  },
  {
    icon: Eye,
    title: 'Before/After Diff',
    description:
      'Visual field-level diff viewer with sensitive data masking. See exactly what changed at a glance, with full context for compliance reviews.',
  },
  {
    icon: Bell,
    title: 'Real-time Alerts',
    description:
      'Configurable alerts for critical changes, anomaly detection, and policy violations. Route to Slack, email, PagerDuty, or webhooks.',
  },
  {
    icon: FileCheck,
    title: 'Compliance Reports',
    description:
      'Generate audit-ready reports for SOX, HIPAA, GDPR, SOC 2, ISO 27001, and more. Export to CSV, PDF, or push to your GRC tool.',
  },
  {
    icon: TrendingUp,
    title: 'Change Analytics',
    description:
      'Dashboards showing change velocity, top entities by activity, operation breakdowns, and anomaly trends across all connected systems.',
  },
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Plug,
    title: 'Connect your applications',
    description:
      'Integrate any business system via REST API, webhook, or lightweight SDK. SentinelAudit begins listening to data events in minutes — no code changes required.',
  },
  {
    step: '02',
    icon: ScrollText,
    title: 'Every change is recorded',
    description:
      'Each create, update, and delete is captured with full before/after state, actor identity, timestamp, and context — then hash-linked into the immutable chain.',
  },
  {
    step: '03',
    icon: ScanSearch,
    title: 'AI analyzes for anomalies',
    description:
      'The anomaly engine continuously evaluates change patterns against historical baselines, flagging statistically unusual activity for review.',
  },
  {
    step: '04',
    icon: ShieldCheck,
    title: 'Verify, report, and comply',
    description:
      'Prove chain integrity with one click, generate compliance reports, and investigate any anomaly with full forensic context at your fingertips.',
  },
];

export const INDUSTRIES: {
  icon: LucideIcon;
  name: string;
  description: string;
  examples: string[];
  accent: string;
}[] = [
  {
    icon: HeartPulse,
    name: 'Healthcare',
    description: 'Track every change to patient records, diagnoses, and insurance data for HIPAA compliance.',
    examples: ['EHR Systems', 'Patient Records', 'Insurance Claims', 'Clinical Notes'],
    accent: 'from-rose-500/20 to-rose-500/5',
  },
  {
    icon: Landmark,
    name: 'Banking & Finance',
    description: 'Immutable audit trail for account balances, transactions, and loan modifications.',
    examples: ['Core Banking', 'Account Balances', 'Loan Records', 'Transaction Logs'],
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: GraduationCap,
    name: 'Education',
    description: 'Version history for student grades, enrollment records, and academic transcripts.',
    examples: ['Student Information', 'Grade Records', 'Enrollment Data', 'Transcripts'],
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: Building2,
    name: 'Government',
    description: 'Tamper-evident records for citizen data, permits, and regulatory filings.',
    examples: ['Citizen Records', 'Permit Systems', 'Regulatory Filings', 'Public Databases'],
    accent: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: Scale,
    name: 'Legal',
    description: 'Track every edit to case files, contracts, and legal documents with full chain of custody.',
    examples: ['Case Files', 'Contracts', 'Legal Documents', 'Evidence Logs'],
    accent: 'from-purple-500/20 to-purple-500/5',
  },
  {
    icon: ShieldCheck,
    name: 'Insurance',
    description: 'Audit policy changes, coverage modifications, and claims data end-to-end.',
    examples: ['Policy Documents', 'Coverage Data', 'Claims Records', 'Beneficiary Info'],
    accent: 'from-cyan-500/20 to-cyan-500/5',
  },
  {
    icon: Briefcase,
    name: 'Enterprise & ERP',
    description: 'Monitor every change across SAP, Oracle, NetSuite, and custom enterprise systems.',
    examples: ['SAP / Oracle', 'Financial Records', 'Inventory Data', 'Procurement'],
    accent: 'from-indigo-500/20 to-indigo-500/5',
  },
  {
    icon: Users,
    name: 'HRMS',
    description: 'Track salary changes, employee records, and organizational data with full transparency.',
    examples: ['Employee Records', 'Salary Data', 'Org Structure', 'Performance Reviews'],
    accent: 'from-teal-500/20 to-teal-500/5',
  },
  {
    icon: Network,
    name: 'CRM',
    description: 'Audit every modification to customer data, deals, and pipeline across your CRM.',
    examples: ['Customer Records', 'Deal Data', 'Pipeline Changes', 'Contact Info'],
    accent: 'from-pink-500/20 to-pink-500/5',
  },
];

export const PRICING = [
  {
    name: 'Starter',
    price: 499,
    period: '/month',
    description: 'For small teams getting started with change intelligence.',
    features: [
      'Up to 50,000 changes/month',
      '3 connected applications',
      '30-day audit retention',
      'Basic anomaly detection',
      'Email alerts',
      'CSV export',
      'Community support',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: 1499,
    period: '/month',
    description: 'For growing organizations with compliance requirements.',
    features: [
      'Up to 500,000 changes/month',
      '15 connected applications',
      '1-year audit retention',
      'Advanced AI anomaly detection',
      'Real-time alerts (Slack, email)',
      'Compliance reports (SOC 2, GDPR)',
      'API access',
      'Priority support',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: null,
    period: '',
    description: 'For large-scale deployments with custom requirements.',
    features: [
      'Unlimited changes',
      'Unlimited connected applications',
      'Unlimited audit retention',
      'Custom anomaly models',
      'Real-time alerts (all channels)',
      'Custom compliance reports',
      'Full API & SDK access',
      'Dedicated success manager',
      'On-premise deployment option',
      '24/7 enterprise support',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
];

export const FAQS = [
  {
    question: 'What makes SentinelAudit AI "tamper-evident"?',
    answer:
      'Every change record is cryptographically hash-linked to the previous one, forming a chain similar to Git or a blockchain. If anyone modifies or deletes a record, the chain breaks and the tampering is immediately detectable. This provides mathematically provable integrity — not just a log file someone could edit.',
  },
  {
    question: 'Which applications can I integrate with?',
    answer:
      'SentinelAudit AI integrates with any application that can send data via REST API, webhook, or our lightweight SDKs (Python, Node.js, Java, Go). We have pre-built connectors for SAP, Oracle, Salesforce, Workday, Epic, Cerner, and 180+ other systems. Custom integrations typically take a few hours.',
  },
  {
    question: 'Do I need to change my existing application code?',
    answer:
      'In most cases, no. SentinelAudit AI can be deployed as a sidecar, middleware layer, or via database triggers that capture changes without modifying your application logic. For deeper integration, our SDKs can be added with a few lines of code.',
  },
  {
    question: 'How does the AI anomaly detection work?',
    answer:
      'The anomaly engine builds behavioral baselines for each actor, entity, and field over time. It then evaluates every change against these baselines using statistical models — detecting off-hours edits, bulk modifications, unusual field changes, privileged account deviations, and more. Each anomaly includes a confidence score and the signals that triggered it.',
  },
  {
    question: 'What compliance standards does SentinelAudit AI support?',
    answer:
      'Out of the box, we provide report templates for SOX, HIPAA, GDPR, SOC 2, ISO 27001, PCI DSS, and FedRAMP. Reports can be exported as PDF or CSV, or pushed directly to GRC tools like ServiceNow, Archer, and LogicGate. Custom report templates can be created for industry-specific requirements.',
  },
  {
    question: 'How long is audit data retained?',
    answer:
      'Retention depends on your plan: Starter includes 30 days, Professional includes 1 year, and Enterprise offers unlimited retention. Data is stored in an append-only, immutable format with redundant backups. You can also configure retention policies per entity type.',
  },
  {
    question: 'Can SentinelAudit AI be deployed on-premise?',
    answer:
      'Yes. The Enterprise plan includes an on-premise deployment option for organizations with strict data residency requirements. We support deployment on AWS, Azure, GCP, and private infrastructure via Kubernetes or Docker.',
  },
  {
    question: 'Is my data encrypted?',
    answer:
      'Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Sensitive fields can be additionally encrypted with customer-managed keys (BYOK). The audit chain itself is protected by SHA-256 hashing, making it cryptographically tamper-evident.',
  },
  {
    question: 'What happens if there is an anomaly in my data?',
    answer:
      'When the AI engine detects an anomaly, it creates an anomaly record with a confidence score, the triggering signals, and a link to the underlying audit entry. You can triage, investigate, and resolve anomalies directly in the console. Real-time alerts can be routed to Slack, email, PagerDuty, or webhooks.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Sign up for a free 14-day trial — no credit card required. Connect your first application using one of our pre-built connectors or SDKs, and SentinelAudit AI will begin recording changes immediately. Most teams are up and running in under 30 minutes.',
  },
];

export const TIMELINE_MILESTONES = [
  {
    year: '2023',
    title: 'The Problem Emerges',
    description:
      'Our founders, working across healthcare and banking, witnessed the same pain: no reliable way to prove what changed, when, and by whom in critical business data.',
    icon: Eye,
  },
  {
    year: '2024',
    title: 'SentinelAudit AI is Born',
    description:
      'We built the first prototype — a tamper-evident change chain inspired by Git, designed for non-developers. The concept resonated immediately with compliance teams.',
    icon: Sparkles,
  },
  {
    year: '2025',
    title: 'AI Anomaly Engine',
    description:
      'We launched the AI-powered anomaly detection engine, transforming audit from passive logging to active intelligence that flags suspicious changes automatically.',
    icon: ScanSearch,
  },
  {
    year: '2026',
    title: 'Universal Platform',
    description:
      'Today, SentinelAudit AI tracks billions of changes across 180+ integrations in healthcare, banking, education, government, and enterprise — and we are just getting started.',
    icon: Globe,
  },
];

export const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Integrity above all',
    description: 'We build systems that are provably trustworthy. If it cannot be verified, it does not ship.',
  },
  {
    icon: Eye,
    title: 'Radical transparency',
    description: 'Every action we take is auditable. We hold ourselves to the same standard we set for our customers.',
  },
  {
    icon: Users,
    title: 'Customer-obsessed',
    description: 'We succeed when our customers can prove compliance with a single click. Everything else is secondary.',
  },
  {
    icon: Sparkles,
    title: 'AI with purpose',
    description: 'We use AI to reduce noise and surface what matters — not to replace human judgment, but to amplify it.',
  },
];

export const TEAM = [
  { name: 'Aarav Mehta', role: 'Co-founder & CEO', initials: 'AM', bio: 'Former CISO at a Fortune 500 healthcare network.' },
  { name: 'Sofia Albrecht', role: 'Co-founder & CTO', initials: 'SA', bio: 'Built distributed systems at Stripe and Snowflake.' },
  { name: 'Daniel Okafor', role: 'VP of Engineering', initials: 'DO', bio: 'Led platform engineering at a top-tier core banking provider.' },
  { name: 'Yuki Tanaka', role: 'Head of AI', initials: 'YT', bio: 'PhD in anomaly detection, ex-Google research scientist.' },
  { name: 'Elena Rossi', role: 'VP of Compliance', initials: 'ER', bio: 'Former Big 4 auditor specializing in SOX and HIPAA.' },
  { name: 'Marcus Webb', role: 'Head of Design', initials: 'MW', bio: 'Designed enterprise tools at Linear and Figma.' },
];

export const CONTACT_METHODS = [
  { icon: Globe, label: 'Website', value: 'www.sentinelaudit.ai' },
  { icon: Building, label: 'Office', value: 'San Francisco · London · Singapore' },
  { icon: Clock, label: 'Support hours', value: '24/7 for Enterprise customers' },
];

export const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Industries', href: '/industries' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/about' },
      { label: 'Blog', href: '/about' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/features' },
      { label: 'API Reference', href: '/features' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Changelog', href: '/about' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/about' },
      { label: 'Terms', href: '/about' },
      { label: 'Security', href: '/features' },
      { label: 'Compliance', href: '/features' },
    ],
  },
];

export const FEATURE_CATEGORIES = [
  {
    icon: ScrollText,
    title: 'Audit & Recording',
    features: [
      { icon: Database, title: 'Change Capture', description: 'Every create, update, delete automatically recorded with full context.' },
      { icon: Fingerprint, title: 'Hash-Linked Chain', description: 'SHA-256 cryptographic linking makes every entry tamper-evident.' },
      { icon: Eye, title: 'Before/After Diff', description: 'Visual field-level comparison with sensitive data masking.' },
      { icon: Clock, title: 'Version Timeline', description: 'Chronological history of every version for any record.' },
    ],
  },
  {
    icon: Sparkles,
    title: 'AI Intelligence',
    features: [
      { icon: ScanSearch, title: 'Anomaly Detection', description: 'Statistical models flag suspicious changes in real time.' },
      { icon: AlertOctagon, title: 'Risk Scoring', description: 'Confidence scores on every anomaly for fast triage.' },
      { icon: TrendingUp, title: 'Behavioral Baselines', description: 'Per-actor, per-entity baselines that learn over time.' },
      { icon: Bell, title: 'Smart Alerts', description: 'Route anomalies to the right people via Slack, email, PagerDuty.' },
    ],
  },
  {
    icon: Plug,
    title: 'Integration & Platform',
    features: [
      { icon: Plug, title: 'Universal Connectors', description: '180+ pre-built connectors for ERP, CRM, HRMS, EHR, and more.' },
      { icon: Layers, title: 'SDKs', description: 'Python, Node.js, Java, Go SDKs for custom integrations.' },
      { icon: Network, title: 'Webhook API', description: 'Real-time event streaming via webhooks or message queues.' },
      { icon: KeyRound, title: 'BYOK Encryption', description: 'Customer-managed keys for sensitive field encryption.' },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Compliance & Reporting',
    features: [
      { icon: FileCheck, title: 'Compliance Templates', description: 'SOX, HIPAA, GDPR, SOC 2, ISO 27001, PCI DSS report templates.' },
      { icon: Download, title: 'Export', description: 'Export to CSV, PDF, or push to GRC tools via API.' },
      { icon: Lock, title: 'Immutable Storage', description: 'Append-only storage with redundant backups and retention policies.' },
      { icon: Search, title: 'Forensic Search', description: 'Search across billions of changes by actor, entity, field, or time.' },
    ],
  },
];
