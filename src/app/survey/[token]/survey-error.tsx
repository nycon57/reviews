import { Card, CardContent } from "@/components/ui/card";
import {
  WarningCircle as AlertCircle,
  Clock,
  CheckCircle,
  FileX,
} from "@phosphor-icons/react/dist/ssr";

interface SurveyErrorProps {
  message: string;
}

export function SurveyError({ message }: SurveyErrorProps) {
  // Determine the error type and icon
  const getErrorDetails = () => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("expired")) {
      return {
        icon: Clock,
        title: "Survey Expired",
        iconColor: "text-amber-500",
        bgColor: "bg-amber-100",
      };
    }

    if (lowerMessage.includes("already been completed") || lowerMessage.includes("completed")) {
      return {
        icon: CheckCircle,
        title: "Already Completed",
        iconColor: "text-green-500",
        bgColor: "bg-green-100",
      };
    }

    if (lowerMessage.includes("not found") || lowerMessage.includes("invalid")) {
      return {
        icon: FileX,
        title: "Survey Not Found",
        iconColor: "text-muted-foreground",
        bgColor: "bg-muted",
      };
    }

    return {
      icon: AlertCircle,
      title: "Unable to Load Survey",
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    };
  };

  const { icon: Icon, title, iconColor, bgColor } = getErrorDetails();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="mx-auto max-w-md shadow-lg">
        <CardContent className="py-12 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgColor} ${iconColor}`}
          >
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-3 text-muted-foreground">{message}</p>

          {message.toLowerCase().includes("expired") && (
            <p className="mt-4 text-sm text-muted-foreground">
              Please contact us if you need a new survey link.
            </p>
          )}

          {message.toLowerCase().includes("already been completed") && (
            <p className="mt-4 text-sm text-muted-foreground">
              Thank you for your feedback! Your response has already been recorded.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
