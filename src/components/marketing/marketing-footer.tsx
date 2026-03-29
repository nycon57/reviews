"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LinkedinLogo as Linkedin,
  TwitterLogo as Twitter,
} from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
      { label: "Demo", href: "/demo" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "vs Experience.com", href: "/compare/experience-com" },
      { label: "vs Birdeye", href: "/compare/birdeye" },
      { label: "vs Trustpilot", href: "/compare/trustpilot" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const socialLinks: FooterLink[] = [
  { label: "LinkedIn", href: "https://linkedin.com", external: true },
  { label: "Twitter", href: "https://twitter.com", external: true },
];

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="border-t border-border/50 bg-background"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <Image
                src="https://temwotqafrafajehuiuh.supabase.co/storage/v1/object/public/repwell/branding/RepWell-Logo-Full-Color.png"
                alt="RepWell"
                width={140}
                height={32}
                sizes="140px"
                className="h-8 w-auto"
                loading="lazy"
              />
            </Link>
            <p className="text-body-sm text-repwell-teal-400 max-w-xs mb-6">
              Collect customer reviews, manage your reputation, and gain
              AI-powered insights to improve customer experience.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mb-8">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100 text-repwell-teal-400 hover:bg-repwell-teal-300 hover:text-white transition-all duration-200"
                  aria-label={link.label}
                >
                  {link.label === "LinkedIn" && <Linkedin className="h-5 w-5" />}
                  {link.label === "Twitter" && <Twitter className="h-5 w-5" />}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <motion.div key={section.title} variants={fadeInUp}>
              <h3 className="font-semibold text-body-sm text-repwell-teal-500 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-body-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Copyright */}
        <motion.div
          variants={fadeInUp}
          className="mt-12 pt-8 border-t border-border/50 text-center"
        >
          <p className="text-body-sm text-repwell-teal-400">
            &copy; {currentYear} RepWell. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
