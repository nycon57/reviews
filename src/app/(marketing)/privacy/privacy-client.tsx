"use client";

import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  ContactCard,
} from "@/components/marketing/legal";

const sections = [
  { id: "introduction", title: "Introduction" },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    subsections: [
      { id: "information-you-provide", title: "Information You Provide" },
      { id: "information-collected-automatically", title: "Information Collected Automatically" },
    ],
  },
  { id: "how-we-use-your-information", title: "How We Use Your Information" },
  { id: "information-sharing", title: "Information Sharing" },
  { id: "data-security", title: "Data Security" },
  { id: "data-retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights" },
  { id: "cookies-and-tracking", title: "Cookies and Tracking" },
  { id: "third-party-services", title: "Third-Party Services" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "international-data-transfers", title: "International Data Transfers" },
  { id: "changes-to-this-policy", title: "Changes to This Policy" },
  { id: "contact-us", title: "Contact Us" },
];

export function PrivacyPageClient() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="January 1, 2025"
      sections={sections}
      contactEmail="privacy@repwell.ai"
    >
      <LegalSection id="introduction" title="Introduction">
        <p>
          RepWell (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
          privacy. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our
          platform, website, and services (collectively, the &quot;Service&quot;).
        </p>
        <p>
          Please read this privacy policy carefully. By using the Service,
          you consent to the practices described in this policy.
        </p>
      </LegalSection>

      <LegalSection id="information-we-collect" title="Information We Collect">
        <LegalSection
          id="information-you-provide"
          title="Information You Provide"
          subsection
        >
          <p>We collect information you provide directly to us, including:</p>
          <LegalList
            variant="definition"
            items={[
              {
                label: "Account Information",
                content: "When you create an account, we collect your name, email address, password, company name, and role.",
              },
              {
                label: "Profile Information",
                content: "Information you add to your profile such as photo, job title, bio, and contact information.",
              },
              {
                label: "Survey Responses",
                content: "Responses submitted through surveys you create or participate in.",
              },
              {
                label: "Communication Data",
                content: "Information in communications you send to us, including support requests and feedback.",
              },
              {
                label: "Payment Information",
                content: "Billing details processed through our secure payment providers.",
              },
            ]}
          />
        </LegalSection>

        <LegalSection
          id="information-collected-automatically"
          title="Information Collected Automatically"
          subsection
        >
          <p>
            When you use our Service, we automatically collect certain
            information:
          </p>
          <LegalList
            variant="definition"
            items={[
              {
                label: "Usage Data",
                content: "Information about how you use the Service, including features accessed, pages viewed, and actions taken.",
              },
              {
                label: "Device Information",
                content: "Device type, operating system, browser type, and unique device identifiers.",
              },
              {
                label: "Log Data",
                content: "IP addresses, access times, and referring URLs.",
              },
              {
                label: "Cookies",
                content: "We use cookies and similar technologies to collect information and improve the Service.",
              },
            ]}
          />
        </LegalSection>
      </LegalSection>

      <LegalSection
        id="how-we-use-your-information"
        title="How We Use Your Information"
      >
        <p>We use the information we collect to:</p>
        <LegalList
          variant="bullet"
          items={[
            { content: "Provide, maintain, and improve the Service" },
            { content: "Process transactions and send related information" },
            { content: "Send you technical notices, updates, and support messages" },
            { content: "Respond to your comments, questions, and requests" },
            { content: "Analyze usage patterns to improve user experience and develop new features" },
            { content: "Detect, prevent, and address technical issues and fraud" },
            { content: "Send marketing communications (with your consent where required)" },
          ]}
        />
      </LegalSection>

      <LegalSection id="information-sharing" title="Information Sharing">
        <p>We may share your information in the following circumstances:</p>
        <LegalList
          variant="definition"
          items={[
            {
              label: "With Your Consent",
              content: "We share information when you give us explicit permission.",
            },
            {
              label: "Service Providers",
              content: "With vendors and service providers who need access to perform services on our behalf.",
            },
            {
              label: "Business Transfers",
              content: "In connection with a merger, acquisition, or sale of assets.",
            },
            {
              label: "Legal Requirements",
              content: "When required by law or to protect our rights and safety.",
            },
            {
              label: "Organization Members",
              content: "With other members of your organization as part of the Service functionality.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection id="data-security" title="Data Security">
        <p>
          We implement appropriate technical and organizational measures to
          protect your personal information, including:
        </p>
        <LegalList
          variant="check"
          items={[
            { content: "Encryption of data in transit and at rest" },
            { content: "Regular security assessments and audits" },
            { content: "Access controls and authentication requirements" },
            { content: "Employee training on data protection" },
          ]}
        />
        <p>
          However, no method of transmission over the Internet is 100%
          secure. While we strive to protect your information, we cannot
          guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection id="data-retention" title="Data Retention">
        <p>
          We retain your information for as long as your account is active
          or as needed to provide you services. We may retain certain
          information for legitimate business purposes or as required by
          law.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your Rights">
        <p>
          Depending on your location, you may have certain rights regarding
          your personal information:
        </p>
        <LegalList
          variant="definition"
          items={[
            {
              label: "Access",
              content: "Request a copy of your personal information.",
            },
            {
              label: "Correction",
              content: "Request correction of inaccurate information.",
            },
            {
              label: "Deletion",
              content: "Request deletion of your personal information.",
            },
            {
              label: "Portability",
              content: "Request a portable copy of your data.",
            },
            {
              label: "Objection",
              content: "Object to certain processing of your information.",
            },
          ]}
        />
        <p>
          To exercise these rights, please contact us at{" "}
          <a href="mailto:privacy@repwell.ai">privacy@repwell.ai</a>.
        </p>
      </LegalSection>

      <LegalSection id="cookies-and-tracking" title="Cookies and Tracking">
        <p>
          We use cookies and similar tracking technologies to collect
          information and improve the Service. You can control cookies
          through your browser settings. Some features of the Service may
          not function properly if cookies are disabled.
        </p>
      </LegalSection>

      <LegalSection id="third-party-services" title="Third-Party Services">
        <p>
          Our Service may contain links to third-party websites and
          services. We are not responsible for the privacy practices of
          these third parties. We encourage you to review their privacy
          policies.
        </p>
      </LegalSection>

      <LegalSection id="childrens-privacy" title="Children&apos;s Privacy">
        <p>
          The Service is not intended for children under 13 years of age. We
          do not knowingly collect personal information from children under
          13. If we learn we have collected such information, we will
          delete it promptly.
        </p>
      </LegalSection>

      <LegalSection
        id="international-data-transfers"
        title="International Data Transfers"
      >
        <p>
          Your information may be transferred to and processed in countries
          other than your own. We ensure appropriate safeguards are in place
          to protect your information in accordance with this policy.
        </p>
      </LegalSection>

      <LegalSection id="changes-to-this-policy" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will
          notify you of any changes by posting the new policy on this page
          and updating the &quot;Last updated&quot; date. Continued use of the Service
          after changes constitutes acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection id="contact-us" title="Contact Us">
        <p>
          If you have questions about this Privacy Policy or our privacy
          practices, please contact us:
        </p>
        <ContactCard
          contact={{
            email: "privacy@repwell.ai",
            address: "RepWell, Austin, TX",
          }}
        />
      </LegalSection>
    </LegalPageLayout>
  );
}
