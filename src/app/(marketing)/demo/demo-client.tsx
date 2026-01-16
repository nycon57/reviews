"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlayCircle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";
import { HeroSection } from "@/components/marketing/hero-section";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    icon: <Clock className="h-5 w-5" />,
    title: "30-Minute Session",
    description: "Quick, focused demos that respect your time",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Personalized Walkthrough",
    description: "We tailor the demo to your specific needs",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Live Platform Access",
    description: "See real features with sample data",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Q&A Time",
    description: "Get all your questions answered",
  },
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
      <HeroSection
        subtitle="Request a Demo"
        title="See RepWell in Action"
        description="Schedule a personalized demo with our team. We'll show you how RepWell can transform your customer experience management in just 30 minutes."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-12 lg:grid-cols-2"
          >
            {/* Left Column - Info */}
            <motion.div variants={fadeInUp}>
              <h2 className="mb-6 text-2xl font-bold">What to Expect</h2>
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                {demoFeatures.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-muted/50 p-6">
                <h3 className="mb-4 font-semibold">In the Demo, You'll See:</h3>
                <ul className="space-y-3">
                  {[
                    "Automated survey creation and distribution",
                    "Real-time analytics and NPS tracking",
                    "AI-powered sentiment analysis",
                    "Team management and leaderboards",
                    "Integration options (Google, Zapier, API)",
                    "Mobile app capabilities",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    Request Your Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">
                        Demo Requested!
                      </h3>
                      <p className="mb-6 text-muted-foreground">
                        Thank you for your interest. Our team will reach out
                        within 24 hours to schedule your personalized demo.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setIsSubmitted(false)}
                      >
                        Submit Another Request
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
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
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
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
                              <FormLabel>Work Email *</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john@company.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Acme Mortgage"
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
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Branch Manager"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    type="tel"
                                    placeholder="(555) 123-4567"
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
                                <FormLabel>Team Size</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
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
                              <FormLabel>
                                Anything specific you'd like to see?
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about your goals or specific features you're interested in..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {error && (
                          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            "Submitting..."
                          ) : (
                            <>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Request Demo
                            </>
                          )}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                          By submitting this form, you agree to our{" "}
                          <a href="/privacy" className="underline">
                            Privacy Policy
                          </a>
                          .
                        </p>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
