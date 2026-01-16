"use client";

import { motion } from "framer-motion";
import { Target, Heart, Lightbulb, Shield, Users, Sparkles } from "lucide-react";
import { HeroSection } from "@/components/marketing/hero-section";
import { staggerContainer, fadeInUp, slideInLeft, slideInRight, viewportOnce } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const values = [
  {
    icon: <Target className="h-6 w-6" />,
    title: "Customer-Centric",
    description:
      "Everything we build starts with the customer experience. We obsess over making every interaction smooth and valuable.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Transparency",
    description:
      "We believe in honest feedback and open communication. Our pricing is clear, our practices are ethical.",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Innovation",
    description:
      "We leverage cutting-edge technology, including AI, to deliver insights that truly matter to our customers.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Trust & Security",
    description:
      "We protect your data like it's our own. Enterprise-grade security is built into everything we do.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Partnership",
    description:
      "We see ourselves as an extension of your team. Your success is our success.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Excellence",
    description:
      "We're never satisfied with 'good enough'. We continuously improve our platform and service.",
  },
];

const timeline = [
  {
    year: "2023",
    title: "The Beginning",
    description:
      "RepWell was founded with a simple mission: help mortgage professionals build trust through authentic customer feedback.",
  },
  {
    year: "2024",
    title: "Platform Launch",
    description:
      "Launched our full-featured platform with survey automation, analytics dashboards, and team management capabilities.",
  },
  {
    year: "2024",
    title: "AI Integration",
    description:
      "Introduced AI-powered sentiment analysis and response suggestions, transforming how teams handle customer feedback.",
  },
  {
    year: "2025",
    title: "Mobile & Integrations",
    description:
      "Released mobile apps and expanded integrations with Google Business, Zapier, and popular LOS platforms.",
  },
  {
    year: "Future",
    title: "What's Next",
    description:
      "Continuing to innovate with advanced AI features, industry benchmarks, and tools that help you deliver exceptional experiences.",
  },
];

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Co-Founder",
    image: "",
    initials: "AJ",
  },
  {
    name: "Sarah Chen",
    role: "CTO & Co-Founder",
    image: "",
    initials: "SC",
  },
  {
    name: "Michael Rivera",
    role: "Head of Product",
    image: "",
    initials: "MR",
  },
  {
    name: "Emily Thompson",
    role: "Head of Customer Success",
    image: "",
    initials: "ET",
  },
];

export function AboutPageClient() {
  return (
    <>
      <HeroSection
        subtitle="About Us"
        title="Building Trust Through Customer Feedback"
        description="We're on a mission to help mortgage professionals collect, manage, and leverage customer reviews to grow their business and build lasting relationships."
      />

      {/* Mission Section */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h2 variants={fadeInUp} className="mb-6 text-3xl font-bold">
              Our Mission
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground"
            >
              In the mortgage industry, trust is everything. Every loan officer
              knows that referrals and reputation drive business. Yet collecting
              and managing customer feedback has traditionally been fragmented,
              manual, and time-consuming.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground"
            >
              RepWell changes that. We've built a comprehensive platform that
              automates review collection, surfaces actionable insights through
              AI, and helps you showcase the great work you do—all while saving
              you hours every week.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-center text-3xl font-bold"
            >
              Our Values
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {values.map((value) => (
                <motion.div key={value.title} variants={fadeInUp}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {value.icon}
                      </div>
                      <CardTitle className="text-lg">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-center text-3xl font-bold"
            >
              Our Journey
            </motion.h2>
            <div className="relative mx-auto max-w-3xl">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 h-full w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" />

              {timeline.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={index % 2 === 0 ? slideInLeft : slideInRight}
                  className={`relative mb-8 flex items-start gap-4 ${
                    index % 2 === 0
                      ? "md:flex-row"
                      : "md:flex-row-reverse md:text-right"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 z-10 h-3 w-3 rounded-full bg-primary md:left-1/2 md:-translate-x-1/2" />

                  {/* Content */}
                  <div
                    className={`ml-10 flex-1 rounded-lg border bg-background p-4 shadow-sm md:ml-0 ${
                      index % 2 === 0 ? "md:mr-8" : "md:ml-8"
                    }`}
                  >
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {item.year}
                    </span>
                    <h3 className="mt-2 font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-center text-3xl font-bold"
            >
              Our Team
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground"
            >
              A passionate team of builders, designers, and customer experience
              experts working to transform how mortgage professionals manage
              their reputation.
            </motion.p>
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <motion.div
                  key={member.name}
                  variants={fadeInUp}
                  className="text-center"
                >
                  <Avatar className="mx-auto mb-4 h-24 w-24">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback className="text-lg">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="container mx-auto px-4 text-center"
        >
          <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold">
            Ready to Join Our Story?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-8 max-w-xl text-muted-foreground"
          >
            Start your free trial today and see how RepWell can transform your
            customer experience management.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex justify-center gap-4">
            <a href="/signup">
              <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Get Started Free
              </button>
            </a>
            <a href="/contact">
              <button className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                Contact Us
              </button>
            </a>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
