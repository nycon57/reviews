'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  Sparkles,
  Copy,
  Check,
  FileText,
  Twitter,
  MessageSquare,
  AlignLeft,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import type { TestimonialFormat, Testimonial } from '@/lib/ai/testimonial-types';
import {
  generateMultipleTestimonialFormats,
  updateTestimonialStatus,
  updateTestimonialContent,
  exportTestimonial,
  generateGraphicForTestimonial,
} from '@/lib/ai/testimonial-actions';

interface TestimonialReviewCandidate {
  id: string;
  text: string | null;
  rating: number;
  customerName: string | null;
  loanOfficerName: string;
  source: string;
  reviewDate: string;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  themes: string[];
  keyPhrases: string[];
}

interface TestimonialGeneratorProps {
  candidates: TestimonialReviewCandidate[];
  onTestimonialsGenerated?: (testimonials: Testimonial[]) => void;
}

const FORMAT_INFO: Record<TestimonialFormat, { label: string; icon: React.ReactNode; description: string }> = {
  headline: {
    label: 'Headline',
    icon: <AlignLeft className="h-4 w-4" />,
    description: 'Single impactful quote',
  },
  short: {
    label: 'Short',
    icon: <MessageSquare className="h-4 w-4" />,
    description: '1-2 sentences',
  },
  medium: {
    label: 'Medium',
    icon: <FileText className="h-4 w-4" />,
    description: 'Full paragraph',
  },
  long: {
    label: 'Long',
    icon: <FileText className="h-4 w-4" />,
    description: 'Extended story',
  },
  social: {
    label: 'Social',
    icon: <Twitter className="h-4 w-4" />,
    description: 'Twitter-ready',
  },
};

export function TestimonialGenerator({
  candidates,
  onTestimonialsGenerated,
}: TestimonialGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [selectedFormats, setSelectedFormats] = useState<TestimonialFormat[]>(['short', 'medium', 'social']);
  const [generatedTestimonials, setGeneratedTestimonials] = useState<Testimonial[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState<Testimonial | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [graphicData, setGraphicData] = useState<string | null>(null);

  const toggleReviewSelection = (reviewId: string) => {
    const newSelection = new Set(selectedReviews);
    if (newSelection.has(reviewId)) {
      newSelection.delete(reviewId);
    } else {
      newSelection.add(reviewId);
    }
    setSelectedReviews(newSelection);
  };

  const toggleFormatSelection = (format: TestimonialFormat) => {
    if (selectedFormats.includes(format)) {
      setSelectedFormats(selectedFormats.filter(f => f !== format));
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  const selectAllReviews = () => {
    if (selectedReviews.size === candidates.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(candidates.map(c => c.id)));
    }
  };

  const handleGenerate = () => {
    if (selectedReviews.size === 0 || selectedFormats.length === 0) return;

    startTransition(async () => {
      const allTestimonials: Testimonial[] = [];

      for (const reviewId of selectedReviews) {
        const result = await generateMultipleTestimonialFormats(reviewId, selectedFormats);
        if (result.success && result.data) {
          allTestimonials.push(...result.data);
        }
      }

      setGeneratedTestimonials(allTestimonials);
      onTestimonialsGenerated?.(allTestimonials);
    });
  };

  const handleCopy = async (testimonial: Testimonial) => {
    await navigator.clipboard.writeText(testimonial.content);
    setCopiedId(testimonial.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = (testimonialId: string) => {
    startTransition(async () => {
      await updateTestimonialStatus(testimonialId, 'approved');
      setGeneratedTestimonials(prev =>
        prev.map(t => t.id === testimonialId ? { ...t, status: 'approved' } : t)
      );
    });
  };

  const handleReject = (testimonialId: string) => {
    startTransition(async () => {
      await updateTestimonialStatus(testimonialId, 'rejected');
      setGeneratedTestimonials(prev =>
        prev.map(t => t.id === testimonialId ? { ...t, status: 'rejected' } : t)
      );
    });
  };

  const handleSaveEdit = () => {
    if (!activeTestimonial) return;

    startTransition(async () => {
      await updateTestimonialContent(activeTestimonial.id, editContent);
      setGeneratedTestimonials(prev =>
        prev.map(t => t.id === activeTestimonial.id ? { ...t, content: editContent } : t)
      );
      setPreviewDialogOpen(false);
      setActiveTestimonial(null);
    });
  };

  const handleExport = (testimonialId: string, format: 'text' | 'html' | 'json') => {
    startTransition(async () => {
      const result = await exportTestimonial(testimonialId, { format });
      if (result.success && result.data) {
        const blob = new Blob([result.data.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `testimonial-${testimonialId.slice(0, 8)}.${format === 'html' ? 'html' : format === 'json' ? 'json' : 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleGenerateGraphic = (testimonialId: string) => {
    startTransition(async () => {
      const result = await generateGraphicForTestimonial(testimonialId, {
        template: 'modern',
      });
      if (result.success && result.data) {
        setGraphicData(result.data.imageData);
      }
    });
  };

  const openPreview = (testimonial: Testimonial) => {
    setActiveTestimonial(testimonial);
    setEditContent(testimonial.content);
    setGraphicData(null);
    setPreviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Testimonial Generator</h2>
          <p className="text-muted-foreground">
            Create marketing-ready testimonials from your best reviews
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isPending || selectedReviews.size === 0 || selectedFormats.length === 0}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Testimonials
        </Button>
      </div>

      {/* Format Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Output Formats</CardTitle>
          <CardDescription>Select which testimonial formats to generate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMAT_INFO) as TestimonialFormat[]).map((format) => {
              const info = FORMAT_INFO[format];
              const isSelected = selectedFormats.includes(format);
              return (
                <Button
                  key={format}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFormatSelection(format)}
                  className="gap-2"
                >
                  {info.icon}
                  {info.label}
                  <span className="text-xs opacity-70">({info.description})</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Review Candidates */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Select Reviews</CardTitle>
              <CardDescription>
                {candidates.length} high-rated reviews available for testimonials
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={selectAllReviews}>
              {selectedReviews.size === candidates.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No eligible reviews found.</p>
              <p className="text-sm">Reviews need 4+ stars and meaningful text to generate testimonials.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {candidates.map((review) => (
                  <div
                    key={review.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedReviews.has(review.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleReviewSelection(review.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedReviews.has(review.id)}
                        onCheckedChange={() => toggleReviewSelection(review.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {review.source}
                          </Badge>
                          {review.sentimentLabel === 'positive' && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              Positive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2 text-muted-foreground">
                          {review.text || 'No text available'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{review.customerName || 'Anonymous'}</span>
                          <span>•</span>
                          <span>{review.loanOfficerName}</span>
                          <span>•</span>
                          <span>{new Date(review.reviewDate).toLocaleDateString()}</span>
                        </div>
                        {review.keyPhrases.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {review.keyPhrases.slice(0, 3).map((phrase, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {phrase}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Generated Testimonials */}
      {generatedTestimonials.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Generated Testimonials</CardTitle>
            <CardDescription>
              {generatedTestimonials.length} testimonials ready for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                {(Object.keys(FORMAT_INFO) as TestimonialFormat[]).map((format) => {
                  const count = generatedTestimonials.filter(t => t.format === format).length;
                  if (count === 0) return null;
                  return (
                    <TabsTrigger key={format} value={format}>
                      {FORMAT_INFO[format].label} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  {generatedTestimonials.map((testimonial) => (
                    <TestimonialCard
                      key={testimonial.id}
                      testimonial={testimonial}
                      onCopy={() => handleCopy(testimonial)}
                      onApprove={() => handleApprove(testimonial.id)}
                      onReject={() => handleReject(testimonial.id)}
                      onPreview={() => openPreview(testimonial)}
                      isCopied={copiedId === testimonial.id}
                    />
                  ))}
                </div>
              </TabsContent>

              {(Object.keys(FORMAT_INFO) as TestimonialFormat[]).map((format) => (
                <TabsContent key={format} value={format} className="mt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    {generatedTestimonials
                      .filter(t => t.format === format)
                      .map((testimonial) => (
                        <TestimonialCard
                          key={testimonial.id}
                          testimonial={testimonial}
                          onCopy={() => handleCopy(testimonial)}
                          onApprove={() => handleApprove(testimonial.id)}
                          onReject={() => handleReject(testimonial.id)}
                          onPreview={() => openPreview(testimonial)}
                          isCopied={copiedId === testimonial.id}
                        />
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Preview/Edit Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Testimonial Preview</DialogTitle>
            <DialogDescription>
              Edit and customize this testimonial before publishing
            </DialogDescription>
          </DialogHeader>

          {activeTestimonial && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{FORMAT_INFO[activeTestimonial.format].label}</Badge>
                <Badge variant={activeTestimonial.status === 'approved' ? 'default' : 'outline'}>
                  {activeTestimonial.status}
                </Badge>
                {activeTestimonial.aiGenerated && (
                  <Badge variant="secondary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  {editContent.length} characters
                </p>
              </div>

              {activeTestimonial.originalQuote && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Original Quote</label>
                  <p className="text-sm text-muted-foreground italic">
                    &quot;{activeTestimonial.originalQuote}&quot;
                  </p>
                </div>
              )}

              {activeTestimonial.keyHighlights.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Highlights</label>
                  <div className="flex flex-wrap gap-1">
                    {activeTestimonial.keyHighlights.map((highlight, i) => (
                      <Badge key={i} variant="secondary">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Graphic Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Graphic Preview</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateGraphic(activeTestimonial.id)}
                    disabled={isPending}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate Graphic
                  </Button>
                </div>
                {graphicData && (
                  <div className="border rounded-lg p-2">
                    <img
                      src={graphicData}
                      alt="Testimonial graphic preview"
                      className="w-full rounded"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = graphicData;
                          a.download = `testimonial-${activeTestimonial.id.slice(0, 8)}.svg`;
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download SVG
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Export</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(activeTestimonial.id, 'text')}
                  >
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(activeTestimonial.id, 'html')}
                  >
                    HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(activeTestimonial.id, 'json')}
                  >
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({
  testimonial,
  onCopy,
  onApprove,
  onReject,
  onPreview,
  isCopied,
}: {
  testimonial: Testimonial;
  onCopy: () => void;
  onApprove: () => void;
  onReject: () => void;
  onPreview: () => void;
  isCopied: boolean;
}) {
  return (
    <Card className="relative">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {FORMAT_INFO[testimonial.format].icon}
            <span className="text-sm font-medium">{FORMAT_INFO[testimonial.format].label}</span>
          </div>
          <Badge
            variant={
              testimonial.status === 'approved'
                ? 'default'
                : testimonial.status === 'rejected'
                ? 'destructive'
                : 'outline'
            }
          >
            {testimonial.status}
          </Badge>
        </div>

        <blockquote className="text-sm border-l-2 pl-3 italic text-muted-foreground mb-4">
          &quot;{testimonial.content}&quot;
        </blockquote>

        {testimonial.review && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < (testimonial.review?.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span>•</span>
            <span>{testimonial.review.customerName || 'Anonymous'}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onPreview}>
            <ExternalLink className="h-4 w-4" />
          </Button>
          {testimonial.status === 'draft' && (
            <>
              <Button variant="default" size="sm" onClick={onApprove}>
                Approve
              </Button>
              <Button variant="outline" size="sm" onClick={onReject}>
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
