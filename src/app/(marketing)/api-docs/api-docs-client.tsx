"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Book,
  Key,
  Clock,
  AlertTriangle,
  Webhook,
  Code,
  Play,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Loader2,
  Send,
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  generateCodeSamples,
  exampleRequestBodies,
  exampleQueryParams,
  type CodeLanguage,
} from "@/lib/openapi";

// Types
interface ApiEndpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description: string;
  tag: string;
  parameters?: ApiParameter[];
  requestBody?: {
    description?: string;
    required?: boolean;
    example?: Record<string, unknown>;
  };
  responses?: Record<string, { description: string }>;
}

interface ApiParameter {
  name: string;
  in: "query" | "path" | "header";
  required?: boolean;
  type: string;
  description?: string;
  example?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

// Navigation sections
const navSections: NavSection[] = [
  { id: "overview", label: "Overview", icon: Book },
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "rate-limiting", label: "Rate Limiting", icon: Clock },
  { id: "endpoints", label: "API Endpoints", icon: Code },
  { id: "playground", label: "API Playground", icon: Play },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "errors", label: "Error Codes", icon: AlertTriangle },
];

// API Endpoints data
const apiEndpoints: ApiEndpoint[] = [
  // Surveys
  {
    method: "GET",
    path: "/api/v1/surveys",
    summary: "List surveys",
    description: "Get a paginated list of surveys for your organization.",
    tag: "Surveys",
    parameters: [
      { name: "page", in: "query", type: "integer", description: "Page number (default: 1)", example: "1" },
      { name: "page_size", in: "query", type: "integer", description: "Items per page (default: 25, max: 100)", example: "25" },
      { name: "status", in: "query", type: "string", description: "Filter by status: pending, sent, completed, expired, cancelled" },
      { name: "loan_officer_id", in: "query", type: "uuid", description: "Filter by loan officer ID" },
      { name: "search", in: "query", type: "string", description: "Search in customer name or email" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/surveys",
    summary: "Create a survey",
    description: "Create a new survey and add it to the distribution queue.",
    tag: "Surveys",
    requestBody: {
      required: true,
      description: "Survey creation payload",
      example: exampleRequestBodies["POST /api/v1/surveys"],
    },
  },
  {
    method: "GET",
    path: "/api/v1/surveys/{id}",
    summary: "Get a survey",
    description: "Get details of a specific survey.",
    tag: "Surveys",
    parameters: [
      { name: "id", in: "path", required: true, type: "uuid", description: "Survey ID" },
    ],
  },
  // Reviews
  {
    method: "GET",
    path: "/api/v1/reviews",
    summary: "List reviews",
    description: "Get a paginated list of reviews for your organization.",
    tag: "Reviews",
    parameters: [
      { name: "page", in: "query", type: "integer", description: "Page number", example: "1" },
      { name: "page_size", in: "query", type: "integer", description: "Items per page", example: "25" },
      { name: "status", in: "query", type: "string", description: "Filter by status: pending, approved, rejected, flagged" },
      { name: "platform", in: "query", type: "string", description: "Filter by platform: google, zillow, internal" },
      { name: "min_rating", in: "query", type: "integer", description: "Minimum rating (1-5)" },
      { name: "max_rating", in: "query", type: "integer", description: "Maximum rating (1-5)" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/reviews/{id}",
    summary: "Get a review",
    description: "Get details of a specific review.",
    tag: "Reviews",
    parameters: [
      { name: "id", in: "path", required: true, type: "uuid", description: "Review ID" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/reviews/{id}/respond",
    summary: "Respond to a review",
    description: "Post a response to a review.",
    tag: "Reviews",
    parameters: [
      { name: "id", in: "path", required: true, type: "uuid", description: "Review ID" },
    ],
    requestBody: {
      required: true,
      example: exampleRequestBodies["POST /api/v1/reviews/{id}/respond"],
    },
  },
  // Branches
  {
    method: "GET",
    path: "/api/v1/branches",
    summary: "List branches",
    description: "Get a paginated list of branches for your organization.",
    tag: "Branches",
    parameters: [
      { name: "page", in: "query", type: "integer", description: "Page number" },
      { name: "is_active", in: "query", type: "boolean", description: "Filter by active status" },
      { name: "region", in: "query", type: "string", description: "Filter by region" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/branches",
    summary: "Create a branch",
    description: "Create a new branch.",
    tag: "Branches",
    requestBody: {
      required: true,
      example: exampleRequestBodies["POST /api/v1/branches"],
    },
  },
  {
    method: "GET",
    path: "/api/v1/branches/{id}",
    summary: "Get a branch",
    description: "Get details of a specific branch.",
    tag: "Branches",
    parameters: [
      { name: "id", in: "path", required: true, type: "uuid", description: "Branch ID" },
    ],
  },
  // Loan Officers
  {
    method: "GET",
    path: "/api/v1/loan-officers",
    summary: "List loan officers",
    description: "Get a paginated list of loan officers for your organization.",
    tag: "Loan Officers",
    parameters: [
      { name: "page", in: "query", type: "integer", description: "Page number" },
      { name: "is_active", in: "query", type: "boolean", description: "Filter by active status" },
      { name: "branch_id", in: "query", type: "uuid", description: "Filter by branch" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/loan-officers/{id}",
    summary: "Get a loan officer",
    description: "Get details of a specific loan officer.",
    tag: "Loan Officers",
    parameters: [
      { name: "id", in: "path", required: true, type: "uuid", description: "Loan officer ID" },
    ],
  },
  {
    method: "PATCH",
    path: "/api/v1/loan-officers/{id}",
    summary: "Update a loan officer",
    description: "Update loan officer details.",
    tag: "Loan Officers",
    parameters: [
      { name: "id", in: "path", required: true, type: "uuid", description: "Loan officer ID" },
    ],
    requestBody: {
      example: exampleRequestBodies["PATCH /api/v1/loan-officers/{id}"],
    },
  },
  // Organization
  {
    method: "GET",
    path: "/api/v1/organization",
    summary: "Get organization",
    description: "Get your organization details.",
    tag: "Organization",
  },
  // Users
  {
    method: "GET",
    path: "/api/v1/users",
    summary: "List users",
    description: "Get a paginated list of users in your organization.",
    tag: "Users",
    parameters: [
      { name: "page", in: "query", type: "integer", description: "Page number" },
      { name: "role", in: "query", type: "string", description: "Filter by role: admin, manager, loan_officer" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/users/invite",
    summary: "Invite a user",
    description: "Invite a new user to your organization.",
    tag: "Users",
    requestBody: {
      required: true,
      example: exampleRequestBodies["POST /api/v1/users/invite"],
    },
  },
];

// Webhook events
const webhookEvents = [
  {
    event: "survey.created",
    description: "Triggered when a new survey is created",
    payload: {
      event: "survey.created",
      timestamp: "2024-01-15T10:30:00Z",
      data: {
        id: "survey_abc123",
        customer_name: "John Smith",
        customer_email: "john@example.com",
        loan_officer_id: "lo_xyz789",
        status: "pending",
      },
    },
  },
  {
    event: "survey.completed",
    description: "Triggered when a customer completes a survey",
    payload: {
      event: "survey.completed",
      timestamp: "2024-01-15T14:30:00Z",
      data: {
        id: "survey_abc123",
        customer_name: "John Smith",
        nps_score: 9,
        rating: 5,
        completed_at: "2024-01-15T14:30:00Z",
      },
    },
  },
  {
    event: "review.received",
    description: "Triggered when a new review is received",
    payload: {
      event: "review.received",
      timestamp: "2024-01-15T16:00:00Z",
      data: {
        id: "review_def456",
        platform: "google",
        rating: 5,
        reviewer_name: "Jane D.",
        review_text: "Excellent service!",
        loan_officer_id: "lo_xyz789",
      },
    },
  },
  {
    event: "review.responded",
    description: "Triggered when a review response is posted",
    payload: {
      event: "review.responded",
      timestamp: "2024-01-15T17:00:00Z",
      data: {
        id: "review_def456",
        response_text: "Thank you for your feedback!",
        responded_at: "2024-01-15T17:00:00Z",
      },
    },
  },
];

// Error codes
const errorCodes = [
  { code: "UNAUTHORIZED", status: 401, description: "Invalid or missing API key" },
  { code: "INVALID_API_KEY", status: 401, description: "The provided API key is invalid" },
  { code: "API_KEY_EXPIRED", status: 401, description: "The API key has expired" },
  { code: "FORBIDDEN", status: 403, description: "Access denied - insufficient permissions" },
  { code: "INSUFFICIENT_PERMISSIONS", status: 403, description: "The API key lacks the required scope for this operation" },
  { code: "NOT_FOUND", status: 404, description: "The requested resource was not found" },
  { code: "VALIDATION_ERROR", status: 400, description: "Request validation failed" },
  { code: "INVALID_REQUEST", status: 400, description: "The request format is invalid" },
  { code: "MISSING_FIELD", status: 400, description: "A required field is missing" },
  { code: "INVALID_FIELD", status: 400, description: "A field has an invalid value" },
  { code: "ALREADY_EXISTS", status: 409, description: "The resource already exists" },
  { code: "CONFLICT", status: 409, description: "The request conflicts with current state" },
  { code: "RATE_LIMIT_EXCEEDED", status: 429, description: "Too many requests - rate limit exceeded" },
  { code: "INTERNAL_ERROR", status: 500, description: "An internal server error occurred" },
  { code: "SERVICE_UNAVAILABLE", status: 503, description: "The service is temporarily unavailable" },
];

// Method badge colors
const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  POST: "bg-blue-500/10 text-blue-600 border-blue-200",
  PATCH: "bg-amber-500/10 text-amber-600 border-amber-200",
  DELETE: "bg-red-500/10 text-red-600 border-red-200",
};

// Pre-compute unique tags from static endpoint data (performance optimization)
const endpointTags = [...new Set(apiEndpoints.map((e) => e.tag))];

// Copy button component with proper error handling and cleanup
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);

  // Clean up timeout on unmount to prevent memory leaks
  React.useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      // Fallback for non-secure contexts or permission denied
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-2 hover:bg-repwell-sage-100/50 rounded-lg transition-colors",
        className
      )}
      title="Copy to clipboard"
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4 text-repwell-teal-400" />
      )}
    </button>
  );
}

// Code block component
function CodeBlock({
  code,
  showLineNumbers = false,
}: {
  code: string;
  showLineNumbers?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <pre
        className={cn(
          "bg-repwell-teal-500 text-repwell-sage-100 rounded-lg p-4 overflow-x-auto text-sm font-mono",
          showLineNumbers && "pl-12"
        )}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Endpoint card component with memoized code samples
function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState<CodeLanguage>("curl");

  // Only generate code samples when the endpoint is expanded (performance optimization)
  const codeSamples = React.useMemo(() => {
    if (!isOpen) return null;
    return generateCodeSamples({
      method: endpoint.method,
      path: endpoint.path,
      queryParams: exampleQueryParams[`${endpoint.method} ${endpoint.path}`],
      body: endpoint.requestBody?.example as Record<string, unknown>,
    });
  }, [isOpen, endpoint.method, endpoint.path, endpoint.requestBody?.example]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full p-4 flex items-center justify-between hover:bg-repwell-sage-100/30 rounded-lg transition-colors text-left">
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className={cn("font-mono text-xs px-2 py-1", methodColors[endpoint.method])}
            >
              {endpoint.method}
            </Badge>
            <span className="font-mono text-sm text-repwell-teal-500">{endpoint.path}</span>
            <span className="text-repwell-teal-400 text-sm hidden md:inline">{endpoint.summary}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-repwell-teal-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-repwell-teal-400" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-4">
          <p className="text-repwell-teal-400">{endpoint.description}</p>

          {/* Parameters */}
          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div>
              <h4 className="font-semibold text-repwell-teal-500 mb-2">Parameters</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-repwell-sage-100/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-repwell-teal-500">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-repwell-teal-500">Type</th>
                      <th className="px-4 py-2 text-left font-medium text-repwell-teal-500 hidden md:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {endpoint.parameters.map((param) => (
                      <tr key={param.name}>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">
                          {param.name}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </td>
                        <td className="px-4 py-2 text-repwell-teal-400">{param.type}</td>
                        <td className="px-4 py-2 text-repwell-teal-400 hidden md:table-cell">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.requestBody?.example && (
            <div>
              <h4 className="font-semibold text-repwell-teal-500 mb-2">Request Body</h4>
              <CodeBlock
                code={JSON.stringify(endpoint.requestBody.example, null, 2)}
                              />
            </div>
          )}

          {/* Code Samples */}
          {codeSamples && (
            <div>
              <h4 className="font-semibold text-repwell-teal-500 mb-2">Code Samples</h4>
              <Tabs value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as CodeLanguage)}>
                <TabsList className="mb-2">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <CodeBlock code={codeSamples.curl} />
                </TabsContent>
                <TabsContent value="javascript">
                  <CodeBlock code={codeSamples.javascript} />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock code={codeSamples.python} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// API Playground component
function ApiPlayground() {
  const [method, setMethod] = React.useState("GET");
  const [path, setPath] = React.useState("/api/v1/surveys");
  const [apiKey, setApiKey] = React.useState("");
  const [requestBody, setRequestBody] = React.useState("");
  const [response, setResponse] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusCode, setStatusCode] = React.useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setResponse(JSON.stringify({ error: "Please enter your API key" }, null, 2));
      setStatusCode(400);
      return;
    }

    // Validate path to prevent SSRF - only allow /api/v1/* endpoints
    if (!path.startsWith("/api/v1/")) {
      setResponse(JSON.stringify({ error: "Invalid endpoint path. Must start with /api/v1/" }, null, 2));
      setStatusCode(400);
      return;
    }

    // Validate JSON body if provided
    if (method !== "GET" && requestBody) {
      try {
        JSON.parse(requestBody);
      } catch {
        setResponse(JSON.stringify({ error: "Invalid JSON in request body" }, null, 2));
        setStatusCode(400);
        return;
      }
    }

    setIsLoading(true);
    setResponse(null);
    setStatusCode(null);

    try {
      const headers = {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      };

      const fetchOptions: { method: string; headers: Record<string, string>; body?: string } = {
        method,
        headers,
      };

      if (method !== "GET" && requestBody) {
        fetchOptions.body = requestBody;
      }

      const res = await fetch(path, fetchOptions);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatusCode(res.status);
    } catch {
      setResponse(
        JSON.stringify(
          { error: "Failed to make request. Make sure you're using a valid endpoint." },
          null,
          2
        )
      );
      setStatusCode(500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="w-full md:w-32">
          <Label htmlFor="method">Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger id="method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="path">Endpoint Path</Label>
          <Input
            id="path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/api/v1/surveys"
            className="font-mono"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="rw_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="font-mono"
        />
      </div>

      {method !== "GET" && (
        <div>
          <Label htmlFor="body">Request Body (JSON)</Label>
          <Textarea
            id="body"
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            placeholder='{"key": "value"}'
            className="font-mono min-h-[120px]"
          />
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Request
          </>
        )}
      </Button>

      {response && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Response</Label>
            {statusCode && (
              <Badge
                variant="outline"
                className={cn(
                  statusCode >= 200 && statusCode < 300
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                    : "bg-red-500/10 text-red-600 border-red-200"
                )}
              >
                {statusCode}
              </Badge>
            )}
          </div>
          <CodeBlock code={response} />
        </div>
      )}
    </form>
  );
}

// Main component
export function ApiDocsClient() {
  const [activeSection, setActiveSection] = React.useState("overview");
  const [activeTag, setActiveTag] = React.useState<string | null>(null);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-repwell-sage-100/30 to-white pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-repwell-teal-300/10 rounded-xl flex items-center justify-center">
                <FileJson className="w-6 h-6 text-repwell-teal-300" />
              </div>
              <Badge variant="outline" className="text-repwell-teal-300 border-repwell-teal-300">
                v1.0
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="font-display text-4xl md:text-5xl font-bold text-repwell-teal-500 mb-4"
            >
              API Documentation
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-repwell-teal-400 mb-6"
            >
              Integrate RepWell&apos;s customer experience and review management
              capabilities into your applications with our REST API.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <a href="/api/openapi.json" target="_blank" rel="noopener noreferrer">
                  <FileJson className="w-4 h-4 mr-2" />
                  OpenAPI Spec
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
              <Button asChild size="sm">
                <a href="/dashboard/settings/api-keys">
                  <Key className="w-4 h-4 mr-2" />
                  Get API Key
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    activeSection === section.id
                      ? "bg-repwell-teal-300/10 text-repwell-teal-300"
                      : "text-repwell-teal-400 hover:bg-repwell-sage-100/50 hover:text-repwell-teal-500"
                  )}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-12">
            {/* Overview */}
            <section id="overview">
              <h2 className="font-display text-2xl font-bold text-repwell-teal-500 mb-4">
                Overview
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-repwell-teal-400 leading-relaxed">
                  The RepWell API is a RESTful API that allows you to integrate survey distribution,
                  review management, and customer experience features into your applications. All
                  endpoints return JSON responses and accept JSON request bodies.
                </p>
                <h3 className="text-lg font-semibold text-repwell-teal-500 mt-6 mb-3">Base URL</h3>
                <CodeBlock code="https://app.repwell.com"  />
                <h3 className="text-lg font-semibold text-repwell-teal-500 mt-6 mb-3">
                  Response Format
                </h3>
                <p className="text-repwell-teal-400 leading-relaxed mb-3">
                  All successful responses follow this format:
                </p>
                <CodeBlock
                  code={JSON.stringify(
                    {
                      success: true,
                      data: {},
                      meta: {
                        request_id: "req_abc123xyz",
                        timestamp: "2024-01-15T10:30:00Z",
                      },
                    },
                    null,
                    2
                  )}
                                  />
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication">
              <h2 className="font-display text-2xl font-bold text-repwell-teal-500 mb-4">
                Authentication
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-repwell-teal-400 leading-relaxed">
                  All API requests require authentication via an API key. Include your API key in
                  the <code className="bg-repwell-sage-100 px-2 py-1 rounded text-sm">X-API-Key</code> header:
                </p>
                <CodeBlock code='X-API-Key: rw_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'  />

                <h3 className="text-lg font-semibold text-repwell-teal-500 mt-6 mb-3">
                  API Key Types
                </h3>
                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                        Live
                      </Badge>
                      <code className="text-sm text-repwell-teal-400">rw_live_*</code>
                    </div>
                    <p className="text-sm text-repwell-teal-400">
                      Production keys for live data. Use in production environments.
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                        Test
                      </Badge>
                      <code className="text-sm text-repwell-teal-400">rw_test_*</code>
                    </div>
                    <p className="text-sm text-repwell-teal-400">
                      Test keys for development. Safe for testing without affecting live data.
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-repwell-teal-500 mt-6 mb-3">
                  API Key Scopes
                </h3>
                <p className="text-repwell-teal-400 leading-relaxed mb-3">
                  API keys can be scoped to specific permissions:
                </p>
                <div className="border border-border rounded-lg overflow-hidden not-prose">
                  <table className="w-full text-sm">
                    <thead className="bg-repwell-sage-100/30">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-repwell-teal-500">Scope</th>
                        <th className="px-4 py-2 text-left font-medium text-repwell-teal-500">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">surveys:read</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Read survey data</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">surveys:write</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Create and update surveys</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">reviews:read</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Read review data</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">reviews:write</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Respond to reviews</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">branches:read</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Read branch data</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">branches:write</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Create and update branches</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">admin</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Full access to all endpoints</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Rate Limiting */}
            <section id="rate-limiting">
              <h2 className="font-display text-2xl font-bold text-repwell-teal-500 mb-4">
                Rate Limiting
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-repwell-teal-400 leading-relaxed">
                  API requests are rate limited to ensure fair usage and system stability.
                </p>

                <h3 className="text-lg font-semibold text-repwell-teal-500 mt-6 mb-3">
                  Rate Limits by Plan
                </h3>
                <div className="grid md:grid-cols-3 gap-4 not-prose mb-6">
                  <div className="border border-border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-repwell-teal-300 mb-1">100</div>
                    <div className="text-sm text-repwell-teal-400">requests/hour</div>
                    <Badge variant="outline" className="mt-2">Basic</Badge>
                  </div>
                  <div className="border border-border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-repwell-teal-300 mb-1">1,000</div>
                    <div className="text-sm text-repwell-teal-400">requests/hour</div>
                    <Badge variant="outline" className="mt-2">Pro</Badge>
                  </div>
                  <div className="border border-border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-repwell-teal-300 mb-1">10,000</div>
                    <div className="text-sm text-repwell-teal-400">requests/hour</div>
                    <Badge variant="outline" className="mt-2">Enterprise</Badge>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-repwell-teal-500 mt-6 mb-3">
                  Rate Limit Headers
                </h3>
                <p className="text-repwell-teal-400 leading-relaxed mb-3">
                  Rate limit information is included in all API responses:
                </p>
                <div className="border border-border rounded-lg overflow-hidden not-prose">
                  <table className="w-full text-sm">
                    <thead className="bg-repwell-sage-100/30">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-repwell-teal-500">Header</th>
                        <th className="px-4 py-2 text-left font-medium text-repwell-teal-500">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">X-RateLimit-Limit</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Your rate limit per hour</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">X-RateLimit-Remaining</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Requests remaining in current window</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-repwell-teal-400">X-RateLimit-Reset</td>
                        <td className="px-4 py-2 text-repwell-teal-400">Unix timestamp when the limit resets</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* API Endpoints */}
            <section id="endpoints">
              <h2 className="font-display text-2xl font-bold text-repwell-teal-500 mb-4">
                API Endpoints
              </h2>

              {/* Tag filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={activeTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTag(null)}
                >
                  All
                </Button>
                {endpointTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={activeTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>

              {/* Endpoints by tag */}
              {(activeTag ? [activeTag] : endpointTags).map((tag) => (
                <div key={tag} className="mb-8">
                  <h3 className="text-lg font-semibold text-repwell-teal-500 mb-3">{tag}</h3>
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {apiEndpoints
                      .filter((e) => e.tag === tag)
                      .map((endpoint) => (
                        <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
                      ))}
                  </div>
                </div>
              ))}
            </section>

            {/* API Playground */}
            <section id="playground">
              <h2 className="font-display text-2xl font-bold text-repwell-teal-500 mb-4">
                API Playground
              </h2>
              <p className="text-repwell-teal-400 mb-6">
                Test API requests directly from your browser. Enter your API key and send requests
                to see live responses.
              </p>
              <div className="border border-border rounded-lg p-6 bg-repwell-sage-100/10">
                <ApiPlayground />
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks">
              <h2 className="font-display text-2xl font-bold text-repwell-teal-500 mb-4">
                Webhooks
              </h2>
              <div className="prose prose-slate max-w-none mb-6">
                <p className="text-repwell-teal-400 leading-relaxed">
                  Webhooks allow you to receive real-time notifications when events occur in RepWell.
                  Configure your webhook endpoint in the dashboard to start receiving events.
                </p>

                <h3 className="text-lg font-semibold text-repwell-teal-500 mt-6 mb-3">
                  Webhook Security
                </h3>
                <p className="text-repwell-teal-400 leading-relaxed">
                  All webhook requests include a signature header for verification:
                </p>
                <CodeBlock code="X-RepWell-Signature: sha256=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  />
              </div>

              <h3 className="text-lg font-semibold text-repwell-teal-500 mb-3">
                Available Events
              </h3>
              <div className="space-y-4">
                {webhookEvents.map((webhook) => (
                  <div key={webhook.event} className="border border-border rounded-lg">
                    <div className="p-4 border-b border-border bg-repwell-sage-100/30">
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-repwell-teal-500 font-semibold">
                          {webhook.event}
                        </code>
                      </div>
                      <p className="text-sm text-repwell-teal-400 mt-1">{webhook.description}</p>
                    </div>
                    <div className="p-4">
                      <Label className="mb-2 block">Example Payload</Label>
                      <CodeBlock code={JSON.stringify(webhook.payload, null, 2)} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Error Codes */}
            <section id="errors">
              <h2 className="font-display text-2xl font-bold text-repwell-teal-500 mb-4">
                Error Codes
              </h2>
              <div className="prose prose-slate max-w-none mb-6">
                <p className="text-repwell-teal-400 leading-relaxed">
                  When an error occurs, the API returns a JSON response with an error object:
                </p>
                <CodeBlock
                  code={JSON.stringify(
                    {
                      success: false,
                      error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid request body",
                        details: {
                          field: "customer_email",
                          issue: "Invalid email format",
                        },
                      },
                      meta: {
                        request_id: "req_abc123xyz",
                        timestamp: "2024-01-15T10:30:00Z",
                      },
                    },
                    null,
                    2
                  )}
                                  />
              </div>

              <h3 className="text-lg font-semibold text-repwell-teal-500 mb-3">
                Error Code Reference
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-repwell-sage-100/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-repwell-teal-500">Code</th>
                      <th className="px-4 py-3 text-left font-medium text-repwell-teal-500">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-repwell-teal-500 hidden md:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {errorCodes.map((error) => (
                      <tr key={error.code}>
                        <td className="px-4 py-3 font-mono text-repwell-teal-400">{error.code}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              error.status >= 500
                                ? "bg-red-500/10 text-red-600 border-red-200"
                                : error.status >= 400
                                ? "bg-amber-500/10 text-amber-600 border-amber-200"
                                : "bg-blue-500/10 text-blue-600 border-blue-200"
                            )}
                          >
                            {error.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-repwell-teal-400 hidden md:table-cell">
                          {error.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
