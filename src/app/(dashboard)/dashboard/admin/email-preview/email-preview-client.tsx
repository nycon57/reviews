"use client";

import * as React from "react";
import { render } from "@react-email/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Code, Eye, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Import email components for preview
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  OrganizationHeader,
  RepwellFooter,
  EmailHeading,
  EmailParagraph,
  PrimaryButton,
  SecondaryButton,
  EmailCard,
  InfoCard,
  SummaryCard,
  Testimonial,
  ReviewCard,
  StatsRow,
  StatsCard,
  Leaderboard,
  CTASection,
  SurveyCTA,
  BannerCTA,
  Spacer,
  Divider,
  Badge as EmailBadge,
  CalloutBox,
  colors,
} from "@/lib/email/components";

// =============================================================================
// SAMPLE EMAIL TEMPLATES FOR PREVIEW
// =============================================================================

function SurveyInvitationEmail() {
  return (
    <EmailLayout preview="We'd love to hear about your experience with John Smith">
      <OrganizationHeader
        name="ABC Mortgage"
        loanOfficer={{
          name: "John Smith",
          title: "Senior Loan Officer",
        }}
      />

      <SingleColumnLayout>
        <EmailHeading as="h2">How was your experience?</EmailHeading>
        <EmailParagraph>
          Thank you for choosing ABC Mortgage for your recent transaction. We hope
          everything went smoothly and would love to hear your feedback.
        </EmailParagraph>
        <EmailParagraph>
          Your opinion matters to us and helps us improve our services for future
          clients like yourself.
        </EmailParagraph>
      </SingleColumnLayout>

      <SurveyCTA
        question="How likely are you to recommend John Smith to a friend or colleague?"
        surveyUrl="https://example.com/survey"
        buttonText="Share Your Feedback"
      />

      <SingleColumnLayout>
        <CalloutBox variant="tip" title="Quick Survey">
          This survey takes less than 2 minutes to complete. Your feedback is
          confidential and helps us serve you better.
        </CalloutBox>
      </SingleColumnLayout>

      <RepwellFooter email="user@example.com" />
    </EmailLayout>
  );
}

function ReviewNotificationEmail() {
  return (
    <EmailLayout preview="You received a new 5-star review!">
      <RepwellHeader />

      <BannerCTA
        text="You received a new 5-star review!"
        buttonText="View Review"
        buttonUrl="https://example.com/review"
      />

      <SingleColumnLayout>
        <EmailHeading as="h2">New Review Received</EmailHeading>
        <EmailParagraph>
          Congratulations! A client just left you a glowing review. Here's what
          they had to say:
        </EmailParagraph>
      </SingleColumnLayout>

      <SingleColumnLayout>
        <ReviewCard
          review="John made our home buying experience absolutely seamless. He was always available to answer questions and guided us through every step of the process. Highly recommend!"
          reviewerName="Sarah M."
          rating={5}
          source="Google"
          date="Today"
        />
      </SingleColumnLayout>

      <SingleColumnLayout>
        <InfoCard type="success" title="Great Work!">
          This review will be visible on your public profile and can be shared
          on social media.
        </InfoCard>
      </SingleColumnLayout>

      <CTASection
        headline="Share Your Success"
        description="Let the world know about this great feedback. Share it on your social channels."
        buttonText="Share Review"
        buttonUrl="https://example.com/share"
        secondaryButtonText="View All Reviews"
        secondaryButtonUrl="https://example.com/reviews"
        variant="brand"
      />

      <RepwellFooter email="user@example.com" />
    </EmailLayout>
  );
}

function WeeklyDigestEmail() {
  return (
    <EmailLayout preview="Your weekly performance summary is ready">
      <RepwellHeader />

      <SingleColumnLayout>
        <EmailHeading as="h1">Weekly Performance Digest</EmailHeading>
        <EmailParagraph muted>
          January 15 - January 21, 2024
        </EmailParagraph>
      </SingleColumnLayout>

      <Spacer size="sm" />

      <SingleColumnLayout>
        <StatsRow
          stats={[
            { value: "+12", label: "New Reviews", trend: { direction: "up", value: "20%" } },
            { value: "4.9", label: "Avg Rating" },
            { value: "72", label: "NPS Score", valueColor: colors.accent.success },
          ]}
        />
      </SingleColumnLayout>

      <Spacer size="md" />

      <SingleColumnLayout>
        <EmailHeading as="h3">Top Performers</EmailHeading>
        <Leaderboard
          entries={[
            { rank: 1, name: "John Smith", value: "24 reviews", rankChange: 2 },
            { rank: 2, name: "Jane Doe", value: "21 reviews", rankChange: -1 },
            { rank: 3, name: "Mike Johnson", value: "18 reviews" },
            { rank: 4, name: "Sarah Williams", value: "15 reviews", rankChange: 3 },
            { rank: 5, name: "Tom Brown", value: "12 reviews", rankChange: -2 },
          ]}
        />
      </SingleColumnLayout>

      <Spacer size="md" />

      <SingleColumnLayout>
        <EmailHeading as="h3">Recent Highlights</EmailHeading>

        <Testimonial
          quote="Best mortgage experience I've ever had. The team was professional and made everything so easy!"
          authorName="Michael R."
          rating={5}
          variant="compact"
        />

        <Spacer size="sm" />

        <Testimonial
          quote="Quick response times and great communication throughout the entire process."
          authorName="Jennifer L."
          rating={5}
          variant="compact"
        />
      </SingleColumnLayout>

      <CTASection
        eyebrow="View Full Report"
        headline="See Your Complete Analytics"
        description="Dive deeper into your performance metrics and discover opportunities for growth."
        buttonText="View Dashboard"
        buttonUrl="https://example.com/dashboard"
        variant="dark"
      />

      <RepwellFooter email="user@example.com" />
    </EmailLayout>
  );
}

function ComponentShowcaseEmail() {
  return (
    <EmailLayout preview="Email component showcase">
      <RepwellHeader variant="default" />

      <SingleColumnLayout>
        <EmailHeading as="h1">Component Showcase</EmailHeading>
        <EmailParagraph>
          This email demonstrates all available email components in the Repwell
          design system.
        </EmailParagraph>
      </SingleColumnLayout>

      <Divider variant="gradient" />

      {/* Typography */}
      <SingleColumnLayout>
        <EmailHeading as="h2">Typography</EmailHeading>
        <EmailHeading as="h3">Heading Level 3</EmailHeading>
        <EmailHeading as="h4">Heading Level 4</EmailHeading>
        <EmailParagraph>
          Regular paragraph text with <strong>bold</strong> and <em>italic</em>{" "}
          styling available.
        </EmailParagraph>
        <EmailParagraph muted size="sm">
          Small muted text for secondary information.
        </EmailParagraph>
      </SingleColumnLayout>

      <Divider />

      {/* Buttons */}
      <SingleColumnLayout>
        <EmailHeading as="h2">Buttons</EmailHeading>
        <PrimaryButton href="#">Primary Button</PrimaryButton>
        <Spacer size="xs" />
        <SecondaryButton href="#">Secondary Button</SecondaryButton>
      </SingleColumnLayout>

      <Divider />

      {/* Cards */}
      <SingleColumnLayout>
        <EmailHeading as="h2">Cards</EmailHeading>

        <EmailCard>
          <EmailHeading as="h4">Default Card</EmailHeading>
          <EmailParagraph size="sm">
            A basic card with the gradient accent bar.
          </EmailParagraph>
        </EmailCard>

        <Spacer size="sm" />

        <SummaryCard
          title="Order Summary"
          items={[
            { label: "Subtotal", value: "$99.00" },
            { label: "Tax", value: "$8.91" },
            { label: "Total", value: "$107.91" },
          ]}
        />
      </SingleColumnLayout>

      <Divider />

      {/* Info Cards */}
      <SingleColumnLayout>
        <EmailHeading as="h2">Info Cards</EmailHeading>

        <InfoCard type="info" title="Information">
          This is an informational message.
        </InfoCard>
        <Spacer size="xs" />
        <InfoCard type="success" title="Success">
          Operation completed successfully.
        </InfoCard>
        <Spacer size="xs" />
        <InfoCard type="warning" title="Warning">
          Please review before proceeding.
        </InfoCard>
        <Spacer size="xs" />
        <InfoCard type="error" title="Error">
          Something went wrong.
        </InfoCard>
      </SingleColumnLayout>

      <Divider />

      {/* Stats */}
      <SingleColumnLayout>
        <EmailHeading as="h2">Stats & Metrics</EmailHeading>

        <StatsCard
          title="This Month"
          stats={[
            { value: "156", label: "Reviews" },
            { value: "4.8", label: "Rating" },
            { value: "+23%", label: "Growth", valueColor: colors.accent.success },
          ]}
        />
      </SingleColumnLayout>

      <Divider />

      {/* Callout */}
      <SingleColumnLayout>
        <EmailHeading as="h2">Callouts</EmailHeading>

        <CalloutBox variant="tip" title="Pro Tip">
          Use callout boxes to highlight important information.
        </CalloutBox>
      </SingleColumnLayout>

      <Divider />

      {/* Badges */}
      <SingleColumnLayout>
        <EmailHeading as="h2">Badges</EmailHeading>
        <EmailParagraph>
          Status indicators:{" "}
          <EmailBadge variant="success">Active</EmailBadge>{" "}
          <EmailBadge variant="warning">Pending</EmailBadge>{" "}
          <EmailBadge variant="error">Expired</EmailBadge>{" "}
          <EmailBadge variant="brand">New</EmailBadge>
        </EmailParagraph>
      </SingleColumnLayout>

      <RepwellFooter email="user@example.com" />
    </EmailLayout>
  );
}

// =============================================================================
// EMAIL TEMPLATES REGISTRY
// =============================================================================

const emailTemplates = {
  "survey-invitation": {
    name: "Survey Invitation",
    description: "Customer survey invitation email",
    component: SurveyInvitationEmail,
  },
  "review-notification": {
    name: "Review Notification",
    description: "New review alert email",
    component: ReviewNotificationEmail,
  },
  "weekly-digest": {
    name: "Weekly Digest",
    description: "Weekly performance summary",
    component: WeeklyDigestEmail,
  },
  "component-showcase": {
    name: "Component Showcase",
    description: "All components demonstration",
    component: ComponentShowcaseEmail,
  },
};

type TemplateKey = keyof typeof emailTemplates;

// =============================================================================
// EMAIL PREVIEW CLIENT COMPONENT
// =============================================================================

export function EmailPreviewClient() {
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateKey>("survey-invitation");
  const [viewMode, setViewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = React.useState<"preview" | "html">("preview");
  const [copied, setCopied] = React.useState(false);

  const template = emailTemplates[selectedTemplate];
  const EmailComponent = template.component;

  // Render email to HTML with loading and error states
  const [htmlContent, setHtmlContent] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [renderError, setRenderError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const renderEmail = async () => {
      setIsLoading(true);
      setRenderError(null);
      try {
        const html = await render(<EmailComponent />, { pretty: true });
        setHtmlContent(html);
      } catch (error) {
        console.error("Error rendering email:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        setRenderError(errorMessage);
        setHtmlContent(`<!DOCTYPE html><html><body style="padding: 40px; font-family: sans-serif; text-align: center;">
          <h2 style="color: #991b1b; margin-bottom: 16px;">Error Rendering Email</h2>
          <p style="color: #666;">${errorMessage}</p>
          <p style="color: #999; font-size: 14px; margin-top: 24px;">Check the console for more details.</p>
        </body></html>`);
      } finally {
        setIsLoading(false);
      }
    };
    renderEmail();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- EmailComponent is derived from selectedTemplate and changes every render, causing infinite re-renders if included
  }, [selectedTemplate]);

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-repwell-teal-400">Email Preview</h1>
          <p className="text-sm text-muted-foreground">
            Preview and test email templates
          </p>
        </div>
        <Badge variant="outline" className="text-repwell-teal-300">
          {Object.keys(emailTemplates).length} Templates
        </Badge>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Template selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Template
              </label>
              <Select
                value={selectedTemplate}
                onValueChange={(value) => setSelectedTemplate(value as TemplateKey)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emailTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("desktop")}
              >
                <Monitor className="h-4 w-4 mr-1" />
                Desktop
              </Button>
              <Button
                variant={viewMode === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("mobile")}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Area */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "html")}>
              <TabsList>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="html" className="gap-2">
                  <Code className="h-4 w-4" />
                  HTML
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "html" && (
              <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy HTML
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab}>
            <TabsContent value="preview" className="m-0">
              <div
                className={cn(
                  "bg-gray-100 p-6 flex justify-center min-h-[600px] items-start"
                )}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-repwell-sage-200 border-t-repwell-teal-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Rendering email...</p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "bg-white shadow-lg transition-all duration-300",
                      viewMode === "mobile" ? "w-[375px]" : "w-full max-w-[620px]"
                    )}
                  >
                    <iframe
                      srcDoc={htmlContent}
                      className="w-full border-0"
                      style={{
                        height: viewMode === "mobile" ? "800px" : "1000px",
                      }}
                      title="Email Preview"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="html" className="m-0">
              <div className="max-h-[600px] overflow-auto">
                <pre className="p-4 text-xs bg-gray-900 text-gray-100 overflow-x-auto">
                  <code>{htmlContent}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{template.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{template.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">React Email</Badge>
            <Badge variant="secondary">Responsive</Badge>
            <Badge variant="secondary">Dark Mode Ready</Badge>
            {renderError && (
              <Badge variant="destructive">Render Error</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
