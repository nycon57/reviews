"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Question as HelpCircle,
  Sparkle as Sparkles,
  Plus,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  Copy,
  Check,
  Microphone as Mic,
} from "@phosphor-icons/react";
import type { AIOptimizedFAQ } from "@/lib/geo/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FAQGeneratorProps {
  faqs: AIOptimizedFAQ[];
  isLoading?: boolean;
  onGenerate?: () => Promise<void>;
  onSaveFAQ?: (faq: AIOptimizedFAQ) => void;
}

export function FAQGenerator({ faqs, isLoading, onGenerate, onSaveFAQ }: FAQGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (onGenerate) {
      setGenerating(true);
      try {
        await onGenerate();
      } finally {
        setGenerating(false);
      }
    }
  };

  const handleCopy = async (faq: AIOptimizedFAQ) => {
    const text = `Q: ${faq.question}\nA: ${faq.answer}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(faq.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">AI-Optimized FAQs</CardTitle>
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">AI-Optimized FAQs</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {faqs.length} FAQs
          </Badge>
        </div>
        <CardDescription>
          FAQs structured for AI search engines and voice assistants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full"
          variant="outline"
        >
          {generating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating FAQs...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI-Optimized FAQs
            </>
          )}
        </Button>

        {/* FAQ List */}
        {faqs.length > 0 ? (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <Collapsible
                key={faq.id}
                open={expandedFaq === faq.id}
                onOpenChange={(open) => setExpandedFaq(open ? faq.id : null)}
              >
                <div className="rounded-lg border">
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="font-medium text-sm">{faq.question}</span>
                      </div>
                      {expandedFaq === faq.id ? (
                        <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-4 pb-4 pt-3">
                      <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        {faq.voiceSearchOptimized && (
                          <Badge variant="outline" className="text-[10px]">
                            <Mic className="mr-1 h-3 w-3" />
                            Voice Ready
                          </Badge>
                        )}
                        {faq.snippetReady && (
                          <Badge variant="outline" className="text-[10px] border-green-500 text-green-700">
                            Snippet Ready
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {faq.category}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(faq)}
                          className="text-xs"
                        >
                          {copiedId === faq.id ? (
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
                        {onSaveFAQ && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSaveFAQ(faq)}
                            className="text-xs"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Save to Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <HelpCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No FAQs generated yet</p>
              <p className="text-xs">Click above to generate AI-optimized FAQs</p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Optimization Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>FAQs with natural questions are more likely to be cited</li>
            <li>Keep answers concise but informative (50-150 words)</li>
            <li>Include specific details that answer the question directly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
