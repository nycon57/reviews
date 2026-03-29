"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  LockKey,
  CloudArrowUp,
  Database,
  Eye,
  Certificate,
  ArrowRight,
  ShieldCheck,
  UserCircleGear,
  Key,
  HardDrives,
  ArrowsClockwise,
  WifiHigh,
  Timer,
  Trash,
  Export,
  FileText,
  UsersThree,
  EnvelopeSimple,
  Warning,
} from "@phosphor-icons/react";
import {
  fadeInUp,
  staggerContainer,
  staggerChildrenDelayed,
  blobFloat,
  blobFloatRotate,
  viewportOnce,
} from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/marketing/cta-section";

/* ─── Data ─── */

const securityFeatures = [
  {
    icon: LockKey,
    title: "Encryption",
    description:
      "AES-256 encryption at rest and TLS 1.3 for all data in transit. Your data is protected at every layer.",
  },
  {
    icon: UserCircleGear,
    title: "Access Controls",
    description:
      "Role-based access control, multi-factor authentication, and SSO integration keep your accounts secure.",
  },
  {
    icon: Eye,
    title: "Monitoring",
    description:
      "24/7 threat detection, real-time alerting, and comprehensive audit logging across all systems.",
  },
];

const complianceItems = [
  {
    icon: ShieldCheck,
    title: "SOC 2 Type II",
    status: "In Progress",
    description:
      "We are actively pursuing SOC 2 Type II certification, demonstrating our commitment to security, availability, and confidentiality controls.",
  },
  {
    icon: Shield,
    title: "GDPR",
    status: "Compliant",
    description:
      "Full compliance with the General Data Protection Regulation. We respect data subject rights including access, rectification, and erasure.",
  },
  {
    icon: Certificate,
    title: "CCPA / CPRA",
    status: "Compliant",
    description:
      "We meet all California Consumer Privacy Act and California Privacy Rights Act requirements for data transparency and consumer rights.",
  },
  {
    icon: LockKey,
    title: "SSL / TLS",
    status: "Active",
    description:
      "All connections secured with modern TLS protocols. We enforce HTTPS across every endpoint and API.",
  },
];

const infrastructureFeatures = [
  {
    icon: CloudArrowUp,
    title: "Cloud Hosting",
    description:
      "Hosted on enterprise-grade cloud infrastructure with multi-region redundancy and automatic failover.",
  },
  {
    icon: Timer,
    title: "99.9% Uptime SLA",
    description:
      "We commit to 99.9% uptime with real-time status monitoring and proactive incident management.",
  },
  {
    icon: HardDrives,
    title: "Automated Backups",
    description:
      "Continuous automated backups with point-in-time recovery. Your data is never at risk of loss.",
  },
  {
    icon: ArrowsClockwise,
    title: "Disaster Recovery",
    description:
      "Comprehensive disaster recovery procedures with tested failover to geographically separate regions.",
  },
  {
    icon: Shield,
    title: "DDoS Protection",
    description:
      "Multi-layered DDoS mitigation at the network and application layers protects service availability.",
  },
  {
    icon: WifiHigh,
    title: "Network Segmentation",
    description:
      "Isolated network environments with strict firewall policies ensure separation of concerns and minimal blast radius.",
  },
];

const dataPractices = [
  {
    icon: Database,
    title: "Data Retention",
    description:
      "Clear retention policies aligned with your business needs. We only keep data as long as necessary.",
  },
  {
    icon: Trash,
    title: "Right to Deletion",
    description:
      "Request complete deletion of your data at any time. We honor erasure requests promptly and thoroughly.",
  },
  {
    icon: Export,
    title: "Data Portability",
    description:
      "Export your data in standard formats whenever you need it. Your data belongs to you.",
  },
  {
    icon: FileText,
    title: "Data Processing Agreements",
    description:
      "We provide DPAs that clearly define how we process and protect your data on your behalf.",
  },
  {
    icon: UsersThree,
    title: "Subprocessor Transparency",
    description:
      "Maintain a current list of subprocessors with advance notice of any changes to our data processing chain.",
  },
];

const trustBadges = [
  { label: "SOC 2", sublabel: "In Progress" },
  { label: "GDPR", sublabel: "Compliant" },
  { label: "CCPA", sublabel: "Compliant" },
  { label: "TLS 1.3", sublabel: "Enforced" },
  { label: "AES-256", sublabel: "At Rest" },
  { label: "99.9%", sublabel: "Uptime SLA" },
];

/* ─── Sections ─── */

function SecurityHero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Background gradient blobs */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloat}
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-repwell-sage-100/40 to-repwell-teal-300/10 blur-3xl"
      />
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloatRotate}
        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-repwell-teal-300/10 to-repwell-sage-100/30 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildrenDelayed}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-6"
            >
              Security & Compliance
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            Your Data,{" "}
            <span className="text-repwell-teal-300">Protected</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed mb-8"
          >
            Enterprise-grade security is built into every layer of RepWell.
            We protect your data with industry-leading encryption, access
            controls, and compliance practices so you can focus on what
            matters — your customers.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/demo">
              <Button size="lg" className="group">
                Book a Demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#security-contact">
              <Button size="lg" variant="outline">
                Contact Security Team
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function SecurityOverviewSection() {
  return (
    <section className="py-16 md:py-24 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              Security Overview
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
          >
            Security at Every Layer
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
          >
            From encryption to monitoring, we implement defense-in-depth to
            keep your data safe.
          </motion.p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-repwell-sage-100 p-6 lg:p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 mb-2">
                {feature.title}
              </h3>
              <p className="text-repwell-teal-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComplianceSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              Compliance
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
          >
            Committed to Compliance
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
          >
            We pursue and maintain industry-recognized certifications and
            regulatory compliance to earn your trust.
          </motion.p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {complianceItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-repwell-sage-100 p-6 lg:p-8 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-sans text-xl font-semibold text-repwell-teal-500">
                      {item.title}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-repwell-sage-200/20 px-2.5 py-0.5 text-xs font-semibold text-repwell-sage-200">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-repwell-teal-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfrastructureSection() {
  return (
    <section className="py-16 md:py-24 bg-repwell-teal-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-white/30 text-white/80 mb-4"
            >
              Infrastructure
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Built for Reliability
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-white/80 max-w-2xl mx-auto"
          >
            Our infrastructure is designed for high availability,
            redundancy, and resilience at every level.
          </motion.p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {infrastructureFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-white/10 bg-white/5 p-6 lg:p-8 backdrop-blur-sm"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataPracticesSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              Data Practices
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
          >
            Your Data, Your Control
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
          >
            We believe in transparency about how your data is handled,
            stored, and protected.
          </motion.p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dataPractices.map((practice, index) => (
            <motion.div
              key={practice.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-repwell-sage-100 p-6 lg:p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300">
                <practice.icon className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2">
                {practice.title}
              </h3>
              <p className="text-repwell-teal-400 leading-relaxed">
                {practice.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBadgesSection() {
  return (
    <section className="py-16 md:py-24 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4"
          >
            Certifications & Standards
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
          >
            The standards and certifications that underpin our security
            posture.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center justify-center rounded-xl border border-repwell-sage-100 bg-white p-6 shadow-sm"
            >
              <Key className="h-8 w-8 text-repwell-teal-300 mb-3" />
              <span className="font-sans text-sm font-semibold text-repwell-teal-500">
                {badge.label}
              </span>
              <span className="font-sans text-xs text-repwell-teal-400 mt-0.5">
                {badge.sublabel}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecurityContactSection() {
  return (
    <section id="security-contact" className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              Security Contact
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4"
          >
            Questions or Concerns?
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 leading-relaxed mb-8"
          >
            Our security team is here to help. Whether you have questions
            about our practices, need a security assessment, or want to
            report a vulnerability, we want to hear from you.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="rounded-xl border border-repwell-sage-100 bg-repwell-sage-100/20 p-8"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300">
                <EnvelopeSimple className="h-7 w-7" />
              </div>
              <div>
                <p className="font-sans font-semibold text-repwell-teal-500 mb-1">
                  Security Team
                </p>
                <a
                  href="mailto:security@repwell.com"
                  className="font-sans text-lg text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors underline underline-offset-4"
                >
                  security@repwell.com
                </a>
              </div>
              <div className="flex items-start gap-2 mt-2 text-left max-w-md">
                <Warning className="h-5 w-5 text-repwell-sage-200 shrink-0 mt-0.5" />
                <p className="font-sans text-sm text-repwell-teal-400">
                  If you discover a security vulnerability, please disclose
                  it responsibly by emailing our security team. We take all
                  reports seriously and will respond promptly.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Page ─── */

export function SecurityPageClient() {
  return (
    <>
      <SecurityHero />
      <SecurityOverviewSection />
      <ComplianceSection />
      <InfrastructureSection />
      <DataPracticesSection />
      <TrustBadgesSection />
      <SecurityContactSection />
      <CTASection
        variant="dark"
        title="Ready to See Our Security in Action?"
        description="Learn how RepWell keeps your data safe while helping you build trust with your customers."
        primaryCta={{ label: "Book a Demo", href: "/demo" }}
        secondaryCta={{ label: "Talk to Sales", href: "/contact" }}
      />
    </>
  );
}
