"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  SpinnerGap as Loader2,
  Check,
  X,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { changePassword } from "@/lib/auth/profile-actions";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/auth/profile-schemas";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function PasswordStrength({ password }: { password: string }) {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const strengthPercentage = (metCount / requirements.length) * 100;

  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strengthPercentage <= 25
              ? "bg-destructive"
              : strengthPercentage <= 50
                ? "bg-warning"
                : strengthPercentage <= 75
                  ? "bg-info"
                  : "bg-success"
          }`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 text-xs ${
              req.met ? "text-success" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true);
    try {
      const result = await changePassword(data);
      if (result.success) {
        toast({
          title: "Password changed",
          description: "Your password has been updated successfully.",
        });
        form.reset();
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              {newPassword && <PasswordStrength password={newPassword} />}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Change password"
          )}
        </Button>
      </form>
    </Form>
  );
}
