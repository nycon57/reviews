"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SpinnerGap as Loader2 } from "@phosphor-icons/react";
import { updateMemberDetails, type OrganizationMember } from "@/lib/organization";
import { useToast } from "@/hooks/use-toast";

const editMemberSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  photo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type EditMemberForm = z.infer<typeof editMemberSchema>;

interface EditTeamMemberDialogProps {
  member: OrganizationMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTeamMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: EditTeamMemberDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      full_name: member.full_name || "",
      photo_url: member.photo_url || "",
    },
  });

  // Reset form when member prop changes
  useEffect(() => {
    form.reset({
      full_name: member.full_name || "",
      photo_url: member.photo_url || "",
    });
  }, [member.id, member.full_name, member.photo_url, form]);

  function onSubmit(data: EditMemberForm) {
    startTransition(async () => {
      const result = await updateMemberDetails(member.id, {
        full_name: data.full_name || undefined,
        photo_url: data.photo_url || undefined,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        onSuccess?.();
        onOpenChange(false);
      }
    });
  }

  const avatarUrl = form.watch("photo_url");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update team member details. Only admins can make these changes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Preview */}
            <div className="flex justify-center pb-2">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || member.photo_url || undefined} />
                <AvatarFallback className="text-xl">
                  {(member.full_name || member.email)
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Read-only fields */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <Input value={member.email} disabled className="bg-muted" />
            </div>

            {/* Editable fields */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
