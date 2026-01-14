"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Code2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SchemaRecommendation } from "@/lib/geo/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SchemaRecommendationsProps {
  recommendations: SchemaRecommendation[];
  isLoading?: boolean;
}

export function SchemaRecommendations({
  recommendations,
  isLoading,
}: SchemaRecommendationsProps) {
  const [expandedSchema, setExpandedSchema] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (markup: string, id: string) => {
    await navigator.clipboard.writeText(markup);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Schema Markup</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Schema Markup</CardTitle>
          </div>
          <CardDescription>Structured data recommendations for AI visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Code2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No recommendations available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'required':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'recommended':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'required':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'recommended':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const implementedCount = recommendations.filter(r => r.isImplemented).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Schema Markup</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {implementedCount}/{recommendations.length} Implemented
          </Badge>
        </div>
        <CardDescription>Structured data recommendations for AI visibility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <Collapsible
            key={rec.id}
            open={expandedSchema === rec.id}
            onOpenChange={(open) => setExpandedSchema(open ? rec.id : null)}
          >
            <div className={cn(
              "rounded-lg border",
              rec.isImplemented && "border-green-200 bg-green-50/50"
            )}>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {rec.isImplemented ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      getPriorityIcon(rec.priority)
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{rec.title}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            rec.isImplemented
                              ? "border-green-500 text-green-700"
                              : getPriorityBadgeClass(rec.priority)
                          )}
                        >
                          {rec.isImplemented ? 'Implemented' : rec.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.schemaType} schema</p>
                    </div>
                  </div>
                  {expandedSchema === rec.id ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-4 pb-4 pt-3 space-y-3">
                  <p className="text-sm text-muted-foreground">{rec.description}</p>

                  {/* Validation status */}
                  {(rec.validationErrors.length > 0 || rec.validationWarnings.length > 0) && (
                    <div className="space-y-2">
                      {rec.validationErrors.map((error, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          {error}
                        </div>
                      ))}
                      {rec.validationWarnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3" />
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommended Markup */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Recommended Markup
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(rec.recommendedMarkup, rec.id)}
                        className="h-7 text-xs"
                      >
                        {copiedId === rec.id ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                      <code>{rec.recommendedMarkup}</code>
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <a
                        href="https://search.google.com/test/rich-results"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Test with Google
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <a
                        href={`https://schema.org/${rec.schemaType}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Schema.org Docs
                      </a>
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {/* Info */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Why Schema Matters:</p>
          <p>
            Structured data helps AI search engines understand your content and increases
            the likelihood of being cited in AI-generated responses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
