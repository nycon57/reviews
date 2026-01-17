import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle, FileX, Ban } from "lucide-react";

interface VideoTestimonialErrorProps {
  message: string;
}

export function VideoTestimonialError({ message }: VideoTestimonialErrorProps) {
  // Determine the error type and icon
  const getErrorDetails = () => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("expired")) {
      return {
        icon: Clock,
        title: "Request Expired",
        iconColor: "text-[#d4a574]",
        bgColor: "bg-[#d4a574]/10",
        helpText: "Please contact the sender if you need a new link.",
      };
    }

    if (lowerMessage.includes("already been submitted") || lowerMessage.includes("submitted")) {
      return {
        icon: CheckCircle,
        title: "Already Submitted",
        iconColor: "text-repwell-sage-200",
        bgColor: "bg-repwell-sage-200/20",
        helpText: "Thank you! Your video testimonial has already been recorded.",
      };
    }

    if (lowerMessage.includes("cancelled")) {
      return {
        icon: Ban,
        title: "Request Cancelled",
        iconColor: "text-muted-foreground",
        bgColor: "bg-muted",
        helpText: "This video testimonial request is no longer active.",
      };
    }

    if (lowerMessage.includes("not found") || lowerMessage.includes("invalid")) {
      return {
        icon: FileX,
        title: "Request Not Found",
        iconColor: "text-muted-foreground",
        bgColor: "bg-muted",
        helpText: "The link may be incorrect or the request may have been removed.",
      };
    }

    return {
      icon: AlertCircle,
      title: "Unable to Load Request",
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      helpText: "Please try again later or contact support.",
    };
  };

  const { icon: Icon, title, iconColor, bgColor, helpText } = getErrorDetails();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8faf8] px-4 py-8">
      <Card className="mx-auto max-w-md shadow-lg">
        <CardContent className="py-12 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgColor} ${iconColor}`}
          >
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="font-sans text-2xl font-semibold text-repwell-teal-500">{title}</h1>
          <p className="mt-3 font-sans text-repwell-teal-400">{message}</p>
          {helpText && (
            <p className="mt-4 font-sans text-sm text-muted-foreground">{helpText}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
