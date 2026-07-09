"use client";

import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  ContactCard,
} from "@/components/marketing/legal";

const sections = [
  { id: "agreement-to-terms", title: "Agreement to Terms" },
  { id: "description-of-service", title: "Description of Service" },
  { id: "account-registration", title: "Account Registration" },
  {
    id: "subscription-and-payments",
    title: "Subscription and Payments",
    subsections: [
      { id: "fees", title: "Fees" },
      { id: "billing", title: "Billing" },
      { id: "changes-to-fees", title: "Changes to Fees" },
    ],
  },
  { id: "acceptable-use", title: "Acceptable Use" },
  {
    id: "user-content",
    title: "User Content",
    subsections: [
      { id: "your-content", title: "Your Content" },
      { id: "responsibility-for-content", title: "Responsibility for Content" },
      { id: "content-removal", title: "Content Removal" },
    ],
  },
  { id: "customer-data", title: "Customer Data" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "third-party-services", title: "Third-Party Services" },
  { id: "disclaimer-of-warranties", title: "Disclaimer of Warranties" },
  { id: "limitation-of-liability", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "termination", title: "Termination" },
  { id: "changes-to-terms", title: "Changes to Terms" },
  {
    id: "general-provisions",
    title: "General Provisions",
    subsections: [
      { id: "governing-law", title: "Governing Law" },
      { id: "dispute-resolution", title: "Dispute Resolution" },
      { id: "entire-agreement", title: "Entire Agreement" },
      { id: "severability", title: "Severability" },
      { id: "waiver", title: "Waiver" },
    ],
  },
  { id: "contact-us", title: "Contact Us" },
];

export function TermsPageClient() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="January 1, 2025"
      sections={sections}
      contactEmail="legal@repwell.ai"
    >
      <LegalSection id="agreement-to-terms" title="Agreement to Terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of
          RepWell&apos;s platform, website, and services (collectively, the
          &quot;Service&quot;). By accessing or using the Service, you agree to be
          bound by these Terms. If you do not agree, please do not use the
          Service.
        </p>
      </LegalSection>

      <LegalSection id="description-of-service" title="Description of Service">
        <p>
          RepWell provides a customer experience management platform that
          enables businesses to collect, manage, and analyze customer
          reviews and feedback. The Service includes features for survey
          creation, automated distribution, analytics, team management, and
          integrations with third-party platforms.
        </p>
      </LegalSection>

      <LegalSection id="account-registration" title="Account Registration">
        <p>
          To use certain features of the Service, you must register for an
          account. You agree to:
        </p>
        <LegalList
          variant="check"
          items={[
            { content: "Provide accurate and complete registration information" },
            { content: "Maintain the security of your account credentials" },
            { content: "Promptly notify us of any unauthorized access" },
            { content: "Accept responsibility for all activities under your account" },
          ]}
        />
        <p>
          We reserve the right to suspend or terminate accounts that violate
          these Terms or for any other reason at our discretion.
        </p>
      </LegalSection>

      <LegalSection
        id="subscription-and-payments"
        title="Subscription and Payments"
      >
        <LegalSection id="fees" title="Fees" subsection>
          <p>
            Certain features of the Service require a paid subscription. By
            subscribing, you agree to pay all applicable fees as described on
            our pricing page. Fees are non-refundable except as expressly
            stated in these Terms.
          </p>
        </LegalSection>

        <LegalSection id="billing" title="Billing" subsection>
          <p>
            Subscriptions are billed in advance on a monthly or annual basis,
            depending on your selected plan. Your subscription will
            automatically renew unless you cancel before the renewal date.
          </p>
        </LegalSection>

        <LegalSection id="changes-to-fees" title="Changes to Fees" subsection>
          <p>
            We may change our fees at any time. We will provide advance notice
            of any fee changes, and you will have the opportunity to cancel
            before the new fees take effect.
          </p>
        </LegalSection>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable Use">
        <p>You agree not to:</p>
        <LegalList
          variant="bullet"
          items={[
            { content: "Use the Service for any illegal purpose or in violation of any laws" },
            { content: "Send unsolicited communications (spam) through the Service" },
            { content: "Upload or transmit malware, viruses, or other harmful code" },
            { content: "Attempt to gain unauthorized access to the Service or its systems" },
            { content: "Interfere with or disrupt the Service or its infrastructure" },
            { content: "Impersonate any person or entity or misrepresent your affiliation" },
            { content: "Use the Service to collect, store, or process sensitive personal information in violation of applicable laws" },
            { content: "Resell, sublicense, or distribute the Service without our written consent" },
            { content: "Create fake reviews or engage in any deceptive practices" },
          ]}
        />
      </LegalSection>

      <LegalSection id="user-content" title="User Content">
        <LegalSection id="your-content" title="Your Content" subsection>
          <p>
            You retain ownership of any content you submit, post, or display
            through the Service (&quot;User Content&quot;). By submitting User Content,
            you grant us a worldwide, non-exclusive, royalty-free license to
            use, copy, modify, and display such content solely to provide and
            improve the Service.
          </p>
        </LegalSection>

        <LegalSection
          id="responsibility-for-content"
          title="Responsibility for Content"
          subsection
        >
          <p>
            You are solely responsible for your User Content and the
            consequences of sharing it. You represent that you have all
            necessary rights to share the content and that it does not violate
            any third-party rights or applicable laws.
          </p>
        </LegalSection>

        <LegalSection id="content-removal" title="Content Removal" subsection>
          <p>
            We reserve the right to remove any User Content that violates
            these Terms or that we deem inappropriate, without prior notice.
          </p>
        </LegalSection>
      </LegalSection>

      <LegalSection id="customer-data" title="Customer Data">
        <p>
          &quot;Customer Data&quot; refers to data you collect through the Service,
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
      </LegalSection>

      <LegalSection id="intellectual-property" title="Intellectual Property">
        <p>
          The Service, including its software, design, features, and content
          (excluding User Content), is owned by RepWell and protected by
          intellectual property laws. You may not copy, modify, distribute,
          or create derivative works based on the Service without our
          written permission.
        </p>
      </LegalSection>

      <LegalSection id="third-party-services" title="Third-Party Services">
        <p>
          The Service may integrate with third-party services (e.g., Google
          Business Profile, Zapier). Your use of such third-party services
          is subject to their respective terms and privacy policies. We are
          not responsible for third-party services.
        </p>
      </LegalSection>

      <LegalSection
        id="disclaimer-of-warranties"
        title="Disclaimer of Warranties"
      >
        <p className="uppercase text-sm">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
          WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
          LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
          WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>
      </LegalSection>

      <LegalSection
        id="limitation-of-liability"
        title="Limitation of Liability"
      >
        <p className="uppercase text-sm">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, REPWELL AND ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF
          OR RELATED TO YOUR USE OF THE SERVICE.
        </p>
        <p className="uppercase text-sm">
          OUR TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL
          NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS
          PRECEDING THE CLAIM.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" title="Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless RepWell and
          its affiliates from any claims, liabilities, damages, losses, and
          expenses arising from your use of the Service, your User Content,
          or your violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="Termination">
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
      </LegalSection>

      <LegalSection id="changes-to-terms" title="Changes to Terms">
        <p>
          We may modify these Terms at any time. We will notify you of
          material changes by posting an update on our website or by email.
          Your continued use of the Service after changes take effect
          constitutes acceptance of the modified Terms.
        </p>
      </LegalSection>

      <LegalSection id="general-provisions" title="General Provisions">
        <LegalSection id="governing-law" title="Governing Law" subsection>
          <p>
            These Terms are governed by the laws of the State of Texas,
            without regard to conflict of law principles.
          </p>
        </LegalSection>

        <LegalSection
          id="dispute-resolution"
          title="Dispute Resolution"
          subsection
        >
          <p>
            Any disputes arising from these Terms or the Service shall be
            resolved through binding arbitration in Austin, Texas, in
            accordance with the rules of the American Arbitration Association.
          </p>
        </LegalSection>

        <LegalSection id="entire-agreement" title="Entire Agreement" subsection>
          <p>
            These Terms, together with our Privacy Policy, constitute the
            entire agreement between you and RepWell regarding the Service.
          </p>
        </LegalSection>

        <LegalSection id="severability" title="Severability" subsection>
          <p>
            If any provision of these Terms is found unenforceable, the
            remaining provisions will continue in effect.
          </p>
        </LegalSection>

        <LegalSection id="waiver" title="Waiver" subsection>
          <p>
            Our failure to enforce any right or provision of these Terms shall
            not constitute a waiver of such right or provision.
          </p>
        </LegalSection>
      </LegalSection>

      <LegalSection id="contact-us" title="Contact Us">
        <p>
          If you have questions about these Terms, please contact us:
        </p>
        <ContactCard
          contact={{
            email: "legal@repwell.ai",
            address: "RepWell, Austin, TX",
          }}
        />
      </LegalSection>
    </LegalPageLayout>
  );
}
