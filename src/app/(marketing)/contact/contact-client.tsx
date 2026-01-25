"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Envelope as Mail,
  Phone,
  Calendar,
  PaperPlaneRight as Send,
  CheckCircle,
  Clock,
  Chats as MessageSquare,
  CaretDown as ChevronDown,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  fadeInUp,
  staggerContainer,
  staggerChildrenDelayed,
  blobFloat,
  blobFloatRotate,
  viewportOnce,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CTASection } from "@/components/marketing/cta-section";
import { submitContactForm } from "@/lib/marketing/actions";
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const subjects = [
  "General Inquiry",
  "Sales Question",
  "Technical Support",
  "Partnership Opportunity",
  "Billing Question",
  "Feature Request",
  "Other",
];

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Send us an email and we'll respond within 24 hours",
    value: "hello@repwell.com",
    href: "mailto:hello@repwell.com",
    cta: "Send Email",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak with our team during business hours",
    value: "(555) 123-4567",
    href: "tel:+15551234567",
    cta: "Call Now",
  },
  {
    icon: Calendar,
    title: "Schedule a Demo",
    description: "Book a personalized walkthrough of RepWell",
    value: "30-minute call",
    href: "/demo",
    cta: "Book Demo",
  },
];

const faqs = [
  {
    question: "How quickly can I get started with RepWell?",
    answer:
      "You can get started in minutes! Simply sign up for a free trial, and you'll have immediate access to our platform. Our onboarding team can also schedule a call to help you set up your account and import existing reviews.",
  },
  {
    question: "Do you offer custom pricing for larger teams?",
    answer:
      "Yes, we offer custom enterprise pricing for teams with more than 50 team members. Contact our sales team to discuss your specific needs and we'll create a tailored package.",
  },
  {
    question: "Can I migrate my existing reviews from another platform?",
    answer:
      "Absolutely! We have a dedicated migration team that can help you import reviews from platforms like Experience.com, Birdeye, or any other review management system. The process is seamless and typically takes 1-2 business days.",
  },
  {
    question: "What integrations do you support?",
    answer:
      "RepWell integrates with Google Business Profile, Zillow, Facebook, LinkedIn, and all major LOS platforms including Encompass, BytePro, and Calyx. We also offer Zapier integration for custom workflows.",
  },
  {
    question: "Is there a contract or can I cancel anytime?",
    answer:
      "We offer both monthly and annual plans. Monthly plans can be canceled anytime with no penalty. Annual plans offer significant savings and include premium support.",
  },
  {
    question: "How does your AI-powered sentiment analysis work?",
    answer:
      "Our AI analyzes review text to identify key themes, sentiment (positive, negative, neutral), and specific topics mentioned. This helps you quickly understand what customers love and where you can improve, without reading every review manually.",
  },
];

// Hero with Contact Method Cards
function ContactHero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Background gradient blobs */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloat}
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-repwell-sage-100/40 to-repwell-teal-300/10 blur-3xl"
      />
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloatRotate}
        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-repwell-teal-300/10 to-repwell-sage-100/30 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildrenDelayed}
          className="text-center max-w-3xl mx-auto mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-6"
            >
              Contact Us
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            Let's Start a{" "}
            <span className="text-repwell-teal-300">Conversation</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed"
          >
            Have a question or want to learn more about RepWell? We'd love to
            hear from you. Our team typically responds within one business day.
          </motion.p>
        </motion.div>

        {/* Contact Method Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Link
                href={method.href}
                className="block h-full bg-white rounded-2xl border border-repwell-sage-100 p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-repwell-teal-300/50 transition-all"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors">
                  <method.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-repwell-teal-500 mb-2">
                  {method.title}
                </h3>
                <p className="text-sm text-repwell-teal-400 leading-relaxed mb-3">
                  {method.description}
                </p>
                <p className="text-sm font-medium text-repwell-teal-300 mb-4">
                  {method.value}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-repwell-teal-300 group-hover:text-repwell-teal-400">
                  {method.cta}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Form Section
function ContactFormSection() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    setError(null);

    const result = await submitContactForm(data);

    if (result.success) {
      setIsSubmitted(true);
      form.reset();
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  }

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid gap-12 lg:grid-cols-5"
        >
          {/* Contact Info Sidebar */}
          <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-8">
            <div>
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
              >
                Get In Touch
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
                We're Here to Help
              </h2>
              <p className="text-lg text-repwell-teal-400 leading-relaxed">
                Fill out the form and our team will get back to you within 24
                hours. We're excited to learn about your needs.
              </p>
            </div>

            {/* Office Hours Card */}
            <div className="bg-white rounded-2xl border border-repwell-sage-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10 text-repwell-teal-300">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-repwell-teal-500">
                  Office Hours
                </h3>
              </div>
              <div className="space-y-2 text-sm text-repwell-teal-400">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium text-repwell-teal-500">
                    9:00 AM - 6:00 PM CT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday - Sunday</span>
                  <span className="font-medium text-repwell-teal-500">
                    Closed
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contact */}
            <div className="bg-white rounded-2xl border border-repwell-sage-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10 text-repwell-teal-300">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-repwell-teal-500">
                  Quick Contact
                </h3>
              </div>
              <div className="space-y-3">
                <a
                  href="mailto:hello@repwell.com"
                  className="flex items-center gap-2 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  hello@repwell.com
                </a>
                <a
                  href="tel:+15551234567"
                  className="flex items-center gap-2 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  (555) 123-4567
                </a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={fadeInUp} className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-repwell-sage-100 p-8 lg:p-10 shadow-sm">
              {isSubmitted ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-repwell-teal-300/10 text-repwell-teal-300"
                  >
                    <CheckCircle className="h-10 w-10" />
                  </motion.div>
                  <h3 className="font-display text-2xl font-bold text-repwell-teal-500 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-repwell-teal-400 mb-8 max-w-sm">
                    Thank you for reaching out. We'll get back to you as soon as
                    possible.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                    className="border-repwell-sage-200 text-repwell-teal-400 hover:bg-repwell-sage-100/50"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h3 className="font-display text-xl font-semibold text-repwell-teal-500 mb-2">
                      Send us a Message
                    </h3>
                    <p className="text-sm text-repwell-teal-400">
                      Fill out the form below and we'll be in touch shortly.
                    </p>
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Name *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John Doe"
                                  className="border-repwell-sage-200 focus:border-repwell-teal-300 focus:ring-repwell-teal-300"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Email *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john@company.com"
                                  className="border-repwell-sage-200 focus:border-repwell-teal-300 focus:ring-repwell-teal-300"
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
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-repwell-teal-500">
                                Company
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Acme Mortgage"
                                  className="border-repwell-sage-200 focus:border-repwell-teal-300 focus:ring-repwell-teal-300"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                                  className="border-repwell-sage-200 focus:border-repwell-teal-300 focus:ring-repwell-teal-300"
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
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-repwell-teal-500">
                              Subject *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-repwell-sage-200 focus:border-repwell-teal-300 focus:ring-repwell-teal-300">
                                  <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subjects.map((subject) => (
                                  <SelectItem key={subject} value={subject}>
                                    {subject}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-repwell-teal-500">
                              Message *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="How can we help you?"
                                className="min-h-[140px] border-repwell-sage-200 focus:border-repwell-teal-300 focus:ring-repwell-teal-300"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full md:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              FAQ
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
          >
            Find answers to common questions about RepWell.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-xl border border-repwell-sage-100 px-6 shadow-sm data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-repwell-teal-500 hover:text-repwell-teal-400 py-5 [&[data-state=open]>svg]:rotate-180">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-repwell-teal-400 leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-repwell-teal-400 mb-4">
            Still have questions? We're happy to help.
          </p>
          <Link href="mailto:hello@repwell.com">
            <Button
              variant="outline"
              className="border-repwell-sage-200 text-repwell-teal-400 hover:bg-repwell-sage-100/50"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Us
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function ContactPageClient() {
  return (
    <>
      {/* Hero with Contact Method Cards */}
      <ContactHero />

      {/* Form + Info Section */}
      <ContactFormSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA */}
      <CTASection
        variant="subtle"
        title="Ready to Get Started?"
        description="Join hundreds of mortgage professionals who trust RepWell to manage their customer experience."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
