"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AvatarUpload } from "@/components/shared";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, uploadAvatar } from "@/lib/auth/profile-actions";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/auth/profile-schemas";

interface ProfileFormProps {
  defaultValues: UpdateProfileInput;
  userInitials?: string;
}

export function ProfileForm({ defaultValues, userInitials = "?" }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="John Doe" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                Your name as it will appear across the platform
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Photo</FormLabel>
              <FormControl>
                <AvatarUpload
                  currentAvatarUrl={field.value}
                  fallbackInitials={userInitials}
                  onUpload={async (file) => {
                    const formData = new FormData();
                    formData.append("file", file);
                    const result = await uploadAvatar(formData);
                    if (result.success && result.url) {
                      field.onChange(result.url);
                      toast({
                        title: "Photo updated",
                        description: "Your profile photo has been updated.",
                      });
                    } else {
                      toast({
                        title: "Upload failed",
                        description: result.error || "Please try again.",
                        variant: "destructive",
                      });
                    }
                    return result;
                  }}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Upload a photo for your profile (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </Form>
  );
}
