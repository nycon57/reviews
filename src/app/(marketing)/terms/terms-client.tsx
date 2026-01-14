"use client";

import { motion } from "framer-motion";
import { HeroSection } from "@/components/marketing/hero-section";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";

export function TermsPageClient() {
  return (
    <>
      <HeroSection
        subtitle="Legal"
        title="Terms of Service"
        description="Last updated: January 1, 2025"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert"
          >
            <motion.div variants={fadeInUp}>
              <h2>Agreement to Terms</h2>
              <p>
                These Terms of Service ("Terms") govern your access to and use of
                ReviewHub's platform, website, and services (collectively, the
                "Service"). By accessing or using the Service, you agree to be
                bound by these Terms. If you do not agree, please do not use the
                Service.
              </p>

              <h2>Description of Service</h2>
              <p>
                ReviewHub provides a customer experience management platform that
                enables businesses to collect, manage, and analyze customer
                reviews and feedback. The Service includes features for survey
                creation, automated distribution, analytics, team management, and
                integrations with third-party platforms.
              </p>

              <h2>Account Registration</h2>
              <p>To use certain features of the Service, you must register for an account. You agree to:</p>
              <ul>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that violate
                these Terms or for any other reason at our discretion.
              </p>

              <h2>Subscription and Payments</h2>
              <h3>Fees</h3>
              <p>
                Certain features of the Service require a paid subscription. By
                subscribing, you agree to pay all applicable fees as described on
                our pricing page. Fees are non-refundable except as expressly
                stated in these Terms.
              </p>
              <h3>Billing</h3>
              <p>
                Subscriptions are billed in advance on a monthly or annual basis,
                depending on your selected plan. Your subscription will
                automatically renew unless you cancel before the renewal date.
              </p>
              <h3>Changes to Fees</h3>
              <p>
                We may change our fees at any time. We will provide advance notice
                of any fee changes, and you will have the opportunity to cancel
                before the new fees take effect.
              </p>

              <h2>Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>
                  Send unsolicited communications (spam) through the Service
                </li>
                <li>
                  Upload or transmit malware, viruses, or other harmful code
                </li>
                <li>
                  Attempt to gain unauthorized access to the Service or its systems
                </li>
                <li>
                  Interfere with or disrupt the Service or its infrastructure
                </li>
                <li>
                  Impersonate any person or entity or misrepresent your affiliation
                </li>
                <li>
                  Use the Service to collect, store, or process sensitive personal
                  information in violation of applicable laws
                </li>
                <li>
                  Resell, sublicense, or distribute the Service without our written
                  consent
                </li>
                <li>
                  Create fake reviews or engage in any deceptive practices
                </li>
              </ul>

              <h2>User Content</h2>
              <h3>Your Content</h3>
              <p>
                You retain ownership of any content you submit, post, or display
                through the Service ("User Content"). By submitting User Content,
                you grant us a worldwide, non-exclusive, royalty-free license to
                use, copy, modify, and display such content solely to provide and
                improve the Service.
              </p>
              <h3>Responsibility for Content</h3>
              <p>
                You are solely responsible for your User Content and the
                consequences of sharing it. You represent that you have all
                necessary rights to share the content and that it does not violate
                any third-party rights or applicable laws.
              </p>
              <h3>Content Removal</h3>
              <p>
                We reserve the right to remove any User Content that violates
                these Terms or that we deem inappropriate, without prior notice.
              </p>

              <h2>Customer Data</h2>
              <p>
                "Customer Data" refers to data you collect through the Service,
                including survey responses and customer information. You retain
                all rights to your Customer Data. We process Customer Data only as
                necessary to provide the Service and as described in our Privacy
                Policy.
              </p>
              <p>
                You are responsible for ensuring that your collection and use of
                Customer Data complies with all applicable laws, including privacy
                and data protection regulations.
              </p>

              <h2>Intellectual Property</h2>
              <p>
                The Service, including its software, design, features, and content
                (excluding User Content), is owned by ReviewHub and protected by
                intellectual property laws. You may not copy, modify, distribute,
                or create derivative works based on the Service without our
                written permission.
              </p>

              <h2>Third-Party Services</h2>
              <p>
                The Service may integrate with third-party services (e.g., Google
                Business Profile, Zapier). Your use of such third-party services
                is subject to their respective terms and privacy policies. We are
                not responsible for third-party services.
              </p>

              <h2>Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
                PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
                WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>

              <h2>Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, REVIEWHUB AND ITS
                OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR
                ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF
                OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
              <p>
                OUR TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL
                NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS
                PRECEDING THE CLAIM.
              </p>

              <h2>Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless ReviewHub and
                its affiliates from any claims, liabilities, damages, losses, and
                expenses arising from your use of the Service, your User Content,
                or your violation of these Terms.
              </p>

              <h2>Termination</h2>
              <p>
                You may terminate your account at any time by contacting us or
                using the account settings. We may terminate or suspend your
                access to the Service at any time, with or without cause, and with
                or without notice.
              </p>
              <p>
                Upon termination, your right to use the Service will immediately
                cease. Provisions that by their nature should survive termination
                will survive, including ownership provisions, warranty
                disclaimers, and limitations of liability.
              </p>

              <h2>Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will notify you of
                material changes by posting an update on our website or by email.
                Your continued use of the Service after changes take effect
                constitutes acceptance of the modified Terms.
              </p>

              <h2>General Provisions</h2>
              <h3>Governing Law</h3>
              <p>
                These Terms are governed by the laws of the State of Texas,
                without regard to conflict of law principles.
              </p>
              <h3>Dispute Resolution</h3>
              <p>
                Any disputes arising from these Terms or the Service shall be
                resolved through binding arbitration in Austin, Texas, in
                accordance with the rules of the American Arbitration Association.
              </p>
              <h3>Entire Agreement</h3>
              <p>
                These Terms, together with our Privacy Policy, constitute the
                entire agreement between you and ReviewHub regarding the Service.
              </p>
              <h3>Severability</h3>
              <p>
                If any provision of these Terms is found unenforceable, the
                remaining provisions will continue in effect.
              </p>
              <h3>Waiver</h3>
              <p>
                Our failure to enforce any right or provision of these Terms shall
                not constitute a waiver of such right or provision.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>
                  Email:{" "}
                  <a href="mailto:legal@reviewhub.com">legal@reviewhub.com</a>
                </li>
                <li>Address: ReviewHub, Austin, TX</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
