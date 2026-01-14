"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Linkedin, Twitter, Loader2 } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/motion";
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
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
      className="border-t bg-muted/30"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ReviewHub</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Collect customer reviews, manage your reputation, and gain
              AI-powered insights to improve customer experience.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mb-6">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.label}
                >
                  {link.label === "LinkedIn" && <Linkedin className="h-5 w-5" />}
                  {link.label === "Twitter" && <Twitter className="h-5 w-5" />}
                </a>
              ))}
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Stay Updated</h3>
              {subscribed ? (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Thanks for subscribing!
                </p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-sm"
                    required
                    aria-label="Email address"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="shrink-0"
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
              <h3 className="font-semibold text-sm mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
          className="mt-12 pt-8 border-t text-center"
        >
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} ReviewHub. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
