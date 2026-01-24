import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  UserMinus as UserX,
  House as Home,
} from "@phosphor-icons/react/dist/ssr";

export default function LONotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <UserX className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The loan officer profile you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="mt-6">
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
