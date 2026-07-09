"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { footerNavigation } from "@/config/navigation";
import { BRAND_LOGO_URL } from "@/lib/brand";

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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-7">
          {/* Brand Column */}
          <motion.div variants={fadeInUp} className="sm:col-span-2">
            <Link href="/" className="inline-block mb-5" aria-label="RepWell home">
              <Image
                src={BRAND_LOGO_URL}
                alt="RepWell"
                width={140}
                height={32}
                sizes="140px"
                className="h-8 w-auto"
                loading="lazy"
              />
            </Link>
            <p className="text-body-sm text-repwell-teal-500 max-w-xs mb-6">
              Collect customer reviews, manage your reputation, and gain
              AI-powered insights to improve customer experience.
            </p>
          </motion.div>

          {/* Link Columns */}
          {footerNavigation.map((section) => (
            <motion.div key={section.title} variants={fadeInUp}>
              <h3 className="font-semibold text-body-sm text-repwell-teal-500 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body-sm text-repwell-teal-500 underline-offset-4 hover:text-repwell-teal-400 hover:underline transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-body-sm text-repwell-teal-500 underline-offset-4 hover:text-repwell-teal-400 hover:underline transition-colors"
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
          <p className="text-body-sm text-repwell-teal-500">
            &copy; {currentYear} RepWell. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
