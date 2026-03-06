import { Badge } from "@/components/ui/badge";
import { type ABTestStatus, getStatusDisplayName } from "@/lib/email-ab-testing";

interface StatusBadgeProps {
  status: ABTestStatus;
}

const statusConfig: Record<
  ABTestStatus,
  { variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  draft: { variant: "outline", className: "text-muted-foreground border-border" },
  active: { variant: "default", className: "bg-green-600 hover:bg-green-700" },
  paused: { variant: "secondary", className: "bg-amber-100 text-amber-700" },
  completed: { variant: "secondary", className: "bg-blue-100 text-blue-700" },
  archived: { variant: "outline", className: "text-muted-foreground border-border" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {getStatusDisplayName(status)}
    </Badge>
  );
}
