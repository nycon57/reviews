import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BuildingOffice as Building2,
  House as Home,
} from "@phosphor-icons/react/dist/ssr";

export default function OrganizationNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Organization Not Found</h1>

        <p className="mt-4 text-muted-foreground">
          The organization you're looking for doesn't exist or may have been removed.
          Please check the URL and try again.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
