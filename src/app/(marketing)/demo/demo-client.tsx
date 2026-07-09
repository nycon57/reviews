"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  PlayCircle,
  CheckCircle,
  Clock,
  Users,
  ChartBar as BarChart3,
  Lightning as Zap,
  ArrowRight,
  Sparkle as Sparkles,
  Calendar,
  Chats as MessageSquare,
} from "@phosphor-icons/react";
import {
  staggerContainer,
  fadeInUp,
  viewportOnce,
  blobFloat,
  blobFloatRotate,
} from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitDemoRequest } from "@/lib/marketing/actions";
import { MARKETING_TRIAL_FACTS } from "@/lib/marketing/pricing-facts";

const demoFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  teamSize: z.string().optional(),
  message: z.string().optional(),
});

type DemoFormValues = z.infer<typeof demoFormSchema>;

const teamSizes = [
  "Just me",
  "2-5 people",
  "6-20 people",
  "21-50 people",
  "51-100 people",
  "100+ people",
];

const demoFeatures = [
  {
    icon: Clock,
    title: "30-Minute Session",
    description: "Quick, focused demos that respect your time",
  },
  {
    icon: Users,
    title: "Personalized Walkthrough",
    description: "We tailor the demo to your specific needs",
  },
  {
    icon: BarChart3,
    title: "Live Platform Access",
    description: "See real features with sample data",
  },
  {
    icon: Zap,
    title: "Q&A Time",
    description: "Get all your questions answered",
  },
];

const demoHighlights = [
  "Automated survey creation and distribution",
  "Real-time analytics and NPS tracking",
  "AI-powered sentiment analysis",
  "Team management and leaderboards",
  "Integration options (Google, Zapier, API)",
  "Mobile app capabilities",
];

export function DemoPageClient() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      jobTitle: "",
      phone: "",
      teamSize: "",
      message: "",
    },
  });

  async function onSubmit(data: DemoFormValues) {
    setIsSubmitting(true);
    setError(null);

    const result = await submitDemoRequest(data);

    if (result.success) {
      setIsSubmitted(true);
      form.reset();
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 lg:py-32 bg-gradient-to-b from-repwell-sage-100/50 to-white overflow-hidden">
        {/* Decorative blobs */}
        <motion.div
          variants={blobFloat}
          initial="initial"
          animate="animate"
          className="absolute top-20 -left-32 w-96 h-96 bg-repwell-teal-300/10 rounded-full blur-3xl"
        />
        <motion.div
          variants={blobFloatRotate}
          initial="initial"
          animate="animate"
          className="absolute -bottom-20 -right-32 w-[500px] h-[500px] bg-repwell-sage-200/30 rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="outline"
                className="border-repwell-teal-300/50 text-repwell-teal-400 mb-6"
              >
                <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                Request a Demo
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-repwell-teal-500 mb-6"
            >
              See RepWell{" "}
              <span className="text-repwell-teal-300">in Action</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-repwell-teal-400 mb-10"
            >
              Schedule a personalized demo with our team. We&apos;ll show you how
              RepWell can transform your customer experience management in just
              30 minutes.
            </motion.p>

            {/* Quick Stats */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-repwell-teal-400"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-repwell-teal-300" />
                <span>30-minute session</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-repwell-teal-300" />
                <span>Live demo environment</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-repwell-teal-300" />
                <span>Q&A included</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-12 lg:grid-cols-2 lg:gap-16"
          >
            {/* Left Column - Info */}
            <motion.div variants={fadeInUp} className="lg:sticky lg:top-32 lg:self-start">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500 mb-8">
                What to Expect
              </h2>

              {/* Feature Cards */}
              <div className="grid gap-4 sm:grid-cols-2 mb-10">
                {demoFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      variants={fadeInUp}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-repwell-sage-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-repwell-sage-100">
                          <Icon className="h-5 w-5 text-repwell-teal-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-repwell-teal-500">
                            {feature.title}
                          </p>
                          <p className="text-sm text-repwell-teal-400 mt-0.5">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Demo Highlights */}
              <div className="bg-repwell-sage-100/40 rounded-2xl p-6 lg:p-8">
                <h3 className="font-semibold text-repwell-teal-500 mb-5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-repwell-teal-300" />
                  In the Demo, You&apos;ll See:
                </h3>
                <ul className="space-y-3">
                  {demoHighlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-repwell-sage-200/50 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-repwell-teal-400" />
                      </div>
                      <span className="text-sm text-repwell-teal-400">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div variants={fadeInUp}>
              <div className="bg-white border border-repwell-sage-100 rounded-3xl p-8 lg:p-10 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-repwell-teal-500">
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-repwell-teal-500">
                      Request Your Demo
                    </h3>
                    <p className="text-sm text-repwell-teal-400">
                      Fill out the form and we&apos;ll be in touch
                    </p>
                  </div>
                </div>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-12 text-center"
                  >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-repwell-sage-100">
                      <CheckCircle className="h-10 w-10 text-repwell-teal-400" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-repwell-teal-500 mb-3">
                      Demo Requested!
                    </h3>
                    <p className="text-repwell-teal-400 mb-8 max-w-sm">
                      Thank you for your interest. Our team will reach out within
                      24 hours to schedule your personalized demo.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsSubmitted(false)}
                      className="border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100/50"
                    >
                      Submit Another Request
                    </Button>
                  </motion.div>
                ) : (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                First Name *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John"
                                  className="h-11 border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Last Name *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Doe"
                                  className="h-11 border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-repwell-teal-500">
                              Work Email *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john@company.com"
                                className="h-11 border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Company *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Acme Inc."
                                  className="h-11 border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="jobTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Job Title
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Branch Manager"
                                  className="h-11 border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Phone
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="(555) 123-4567"
                                  className="h-11 border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="teamSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Team Size
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20">
                                    <SelectValue placeholder="Select team size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {teamSizes.map((size) => (
                                    <SelectItem key={size} value={size}>
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-repwell-teal-500">
                              Anything specific you&apos;d like to see?
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your goals or specific features you're interested in..."
                                className="min-h-[100px] border-repwell-sage-100 focus:border-repwell-teal-300 focus:ring-repwell-teal-300/20 resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {error && (
                        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-medium bg-repwell-teal-500 hover:bg-repwell-teal-400"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Submitting...
                          </span>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-5 w-5" />
                            Request Demo
                          </>
                        )}
                      </Button>

                      <p className="text-center text-xs text-repwell-teal-400">
                        By submitting this form, you agree to our{" "}
                        <Link
                          href="/privacy"
                          className="text-repwell-teal-300 hover:underline"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </form>
                  </Form>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-repwell-teal-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Prefer to Explore on Your Own?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-repwell-sage-100 mb-8 max-w-xl mx-auto"
            >
              Start your {MARKETING_TRIAL_FACTS.shortCopy} and experience
              RepWell firsthand. A credit card is required to activate the trial.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-repwell-teal-500 hover:bg-repwell-sage-100 h-12 px-8"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-repwell-teal-500 h-12 px-8"
                >
                  View Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
