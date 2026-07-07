import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Terminal state for an unresolvable unsubscribe link (invalid, expired, or the
 * column isn't deployed yet). Intentionally generic — never reveals whether a
 * token exists.
 */
export function ContactUnsubscribeError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-repwell-sage-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <WarningCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-heading">
            Link unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Button variant="outline" className="mt-6" asChild>
            <a href="mailto:support@repwell.com">Contact Support</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
