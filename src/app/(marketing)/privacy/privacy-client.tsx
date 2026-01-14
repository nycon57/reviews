"use client";

import { motion } from "framer-motion";
import { HeroSection } from "@/components/marketing/hero-section";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";

export function PrivacyPageClient() {
  return (
    <>
      <HeroSection
        subtitle="Legal"
        title="Privacy Policy"
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
              <h2>Introduction</h2>
              <p>
                ReviewHub ("we," "our," or "us") is committed to protecting your
                privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our
                platform, website, and services (collectively, the "Service").
              </p>
              <p>
                Please read this privacy policy carefully. By using the Service,
                you consent to the practices described in this policy.
              </p>

              <h2>Information We Collect</h2>
              <h3>Information You Provide</h3>
              <p>We collect information you provide directly to us, including:</p>
              <ul>
                <li>
                  <strong>Account Information:</strong> When you create an account,
                  we collect your name, email address, password, company name, and
                  role.
                </li>
                <li>
                  <strong>Profile Information:</strong> Information you add to your
                  profile such as photo, job title, bio, and contact information.
                </li>
                <li>
                  <strong>Survey Responses:</strong> Responses submitted through
                  surveys you create or participate in.
                </li>
                <li>
                  <strong>Communication Data:</strong> Information in communications
                  you send to us, including support requests and feedback.
                </li>
                <li>
                  <strong>Payment Information:</strong> Billing details processed
                  through our secure payment providers.
                </li>
              </ul>

              <h3>Information Collected Automatically</h3>
              <p>
                When you use our Service, we automatically collect certain
                information:
              </p>
              <ul>
                <li>
                  <strong>Usage Data:</strong> Information about how you use the
                  Service, including features accessed, pages viewed, and actions
                  taken.
                </li>
                <li>
                  <strong>Device Information:</strong> Device type, operating system,
                  browser type, and unique device identifiers.
                </li>
                <li>
                  <strong>Log Data:</strong> IP addresses, access times, and
                  referring URLs.
                </li>
                <li>
                  <strong>Cookies:</strong> We use cookies and similar technologies
                  to collect information and improve the Service.
                </li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>
                  Analyze usage patterns to improve user experience and develop new
                  features
                </li>
                <li>Detect, prevent, and address technical issues and fraud</li>
                <li>
                  Send marketing communications (with your consent where required)
                </li>
              </ul>

              <h2>Information Sharing</h2>
              <p>We may share your information in the following circumstances:</p>
              <ul>
                <li>
                  <strong>With Your Consent:</strong> We share information when you
                  give us explicit permission.
                </li>
                <li>
                  <strong>Service Providers:</strong> With vendors and service
                  providers who need access to perform services on our behalf.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger,
                  acquisition, or sale of assets.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or to
                  protect our rights and safety.
                </li>
                <li>
                  <strong>Organization Members:</strong> With other members of your
                  organization as part of the Service functionality.
                </li>
              </ul>

              <h2>Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to
                protect your personal information, including:
              </p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication requirements</li>
                <li>Employee training on data protection</li>
              </ul>
              <p>
                However, no method of transmission over the Internet is 100%
                secure. While we strive to protect your information, we cannot
                guarantee absolute security.
              </p>

              <h2>Data Retention</h2>
              <p>
                We retain your information for as long as your account is active
                or as needed to provide you services. We may retain certain
                information for legitimate business purposes or as required by
                law.
              </p>

              <h2>Your Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding
                your personal information:
              </p>
              <ul>
                <li>
                  <strong>Access:</strong> Request a copy of your personal
                  information.
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  information.
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information.
                </li>
                <li>
                  <strong>Portability:</strong> Request a portable copy of your
                  data.
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain processing of your
                  information.
                </li>
              </ul>
              <p>
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@reviewhub.com">privacy@reviewhub.com</a>.
              </p>

              <h2>Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to collect
                information and improve the Service. You can control cookies
                through your browser settings. Some features of the Service may
                not function properly if cookies are disabled.
              </p>

              <h2>Third-Party Services</h2>
              <p>
                Our Service may contain links to third-party websites and
                services. We are not responsible for the privacy practices of
                these third parties. We encourage you to review their privacy
                policies.
              </p>

              <h2>Children's Privacy</h2>
              <p>
                The Service is not intended for children under 13 years of age. We
                do not knowingly collect personal information from children under
                13. If we learn we have collected such information, we will
                delete it promptly.
              </p>

              <h2>International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries
                other than your own. We ensure appropriate safeguards are in place
                to protect your information in accordance with this policy.
              </p>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the "Last updated" date. Continued use of the Service
                after changes constitutes acceptance of the updated policy.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy
                practices, please contact us at:
              </p>
              <ul>
                <li>
                  Email:{" "}
                  <a href="mailto:privacy@reviewhub.com">privacy@reviewhub.com</a>
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
