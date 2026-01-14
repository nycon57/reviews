"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Linkedin, Twitter, Loader2 } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      { label: "Pricing", href: "/pricing" },
      { label: "Demo", href: "/demo" },
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
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call - in production, connect to Resend or other email service
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubscribed(true);
    setIsSubmitting(false);
    setEmail("");
  };

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="border-t border-brand-silver/50 bg-brand-snow"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
                <Star className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-brand-navy">ReviewHub</span>
            </Link>
            <p className="text-body-sm text-brand-slate max-w-xs mb-6">
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-frost text-brand-slate hover:bg-brand-blue hover:text-white transition-all duration-200"
                  aria-label={link.label}
                >
                  {link.label === "LinkedIn" && <Linkedin className="h-5 w-5" />}
                  {link.label === "Twitter" && <Twitter className="h-5 w-5" />}
                </a>
              ))}
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="font-semibold text-body-sm text-brand-navy mb-3">Stay Updated</h3>
              {subscribed ? (
                <p className="text-body-sm text-brand-emerald font-medium">
                  Thanks for subscribing!
                </p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-body-sm"
                    required
                    aria-label="Email address"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="brand"
                    disabled={isSubmitting}
                    className="shrink-0 h-10"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <motion.div key={section.title} variants={fadeInUp}>
              <h3 className="font-semibold text-body-sm text-brand-navy mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body-sm text-brand-slate hover:text-brand-blue transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-body-sm text-brand-slate hover:text-brand-blue transition-colors"
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
          className="mt-12 pt-8 border-t border-brand-silver/50 text-center"
        >
          <p className="text-body-sm text-brand-slate">
            &copy; {currentYear} ReviewHub. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
