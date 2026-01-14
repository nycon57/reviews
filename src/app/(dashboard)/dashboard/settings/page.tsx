import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/shared";
import { GoogleIntegrationCard } from "@/components/google/google-integration-card";
import { NotificationPreferencesCard } from "@/components/notifications";

export const metadata = {
  title: "Settings | ReviewHub",
  description: "Manage your account settings and preferences",
};

function GoogleCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

function NotificationCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings sections */}
      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how ReviewHub looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred color theme
                </p>
              </div>
              <ThemeToggle variant="full" />
            </div>
          </CardContent>
        </Card>

        {/* Google Integration */}
        <Suspense fallback={<GoogleCardSkeleton />}>
          <GoogleIntegrationCard />
        </Suspense>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Suspense fallback={<NotificationCardSkeleton />}>
          <NotificationPreferencesCard />
        </Suspense>
      </div>
    </div>
  );
}
