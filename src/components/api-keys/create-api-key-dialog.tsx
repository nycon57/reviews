'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Key,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createApiKey } from '@/lib/api-keys/actions';
import { API_KEY_SCOPES, type ApiKeyScope, type CreateApiKeyResult } from '@/lib/api-keys/types';

const scopeGroups = [
  {
    name: 'Surveys',
    scopes: ['surveys:read', 'surveys:write'] as ApiKeyScope[],
  },
  {
    name: 'Reviews',
    scopes: ['reviews:read', 'reviews:write'] as ApiKeyScope[],
  },
  {
    name: 'Branches',
    scopes: ['branches:read', 'branches:write'] as ApiKeyScope[],
  },
  {
    name: 'Professionals',
    scopes: ['professionals:read', 'professionals:write'] as ApiKeyScope[],
  },
  {
    name: 'Organization',
    scopes: ['organization:read', 'organization:write'] as ApiKeyScope[],
  },
  {
    name: 'Users',
    scopes: ['users:read', 'users:write'] as ApiKeyScope[],
  },
  {
    name: 'Webhooks',
    scopes: ['webhooks:trigger', 'webhooks:manage'] as ApiKeyScope[],
  },
];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  environment: z.enum(['live', 'test']),
  scopes: z
    .array(z.enum(API_KEY_SCOPES as readonly [string, ...string[]]))
    .min(1, 'Select at least one scope'),
  rateLimit: z.coerce.number().int().min(1).max(100000).optional(),
  expiresIn: z.enum(['never', '30', '60', '90', '365']),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateApiKeyDialogProps {
  onKeyCreated?: (result: CreateApiKeyResult) => void;
}

export function CreateApiKeyDialog({ onKeyCreated }: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      environment: 'live',
      scopes: [],
      rateLimit: 1000,
      expiresIn: 'never',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    // Calculate expiration date
    let expiresAt: string | undefined;
    if (values.expiresIn !== 'never') {
      const days = parseInt(values.expiresIn);
      const date = new Date();
      date.setDate(date.getDate() + days);
      expiresAt = date.toISOString();
    }

    const result = await createApiKey({
      name: values.name,
      description: values.description,
      environment: values.environment,
      scopes: values.scopes as ApiKeyScope[],
      rateLimit: values.rateLimit,
      expiresAt,
    });

    setLoading(false);

    if (result.success && result.data) {
      toast({
        title: 'API key created',
        description: 'Make sure to copy your key now. It won\'t be shown again.',
      });
      form.reset();
      setOpen(false);
      onKeyCreated?.(result.data);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create API key',
        variant: 'destructive',
      });
    }
  };

  const selectedScopes = form.watch('scopes');

  const toggleScope = (scope: ApiKeyScope) => {
    const current = form.getValues('scopes');
    if (current.includes(scope)) {
      form.setValue(
        'scopes',
        current.filter((s) => s !== scope),
        { shouldValidate: true }
      );
    } else {
      form.setValue('scopes', [...current, scope], { shouldValidate: true });
    }
  };

  const selectAllScopes = () => {
    const allScopes = scopeGroups.flatMap((g) => g.scopes);
    form.setValue('scopes', allScopes, { shouldValidate: true });
  };

  const clearAllScopes = () => {
    form.setValue('scopes', [], { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-repwell-teal-300 hover:bg-repwell-teal-400">
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create API Key
          </DialogTitle>
          <DialogDescription>
            Create a new API key to integrate with the RepWell API. The key will
            only be shown once after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Integration" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this key
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Used for syncing data with our CRM..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="live">Live (Production)</SelectItem>
                        <SelectItem value="test">Test (Sandbox)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select expiration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rateLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Limit (requests/hour)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum API requests allowed per hour
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scopes"
              render={() => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Permissions</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={selectAllScopes}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={clearAllScopes}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 space-y-4 max-h-[200px] overflow-y-auto">
                    {scopeGroups.map((group) => (
                      <div key={group.name}>
                        <div className="text-sm font-medium text-repwell-teal-500 mb-2">
                          {group.name}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {group.scopes.map((scope) => (
                            <div
                              key={scope}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={scope}
                                checked={selectedScopes.includes(scope)}
                                onCheckedChange={() => toggleScope(scope)}
                              />
                              <label
                                htmlFor={scope}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                {scope.split(':')[1]}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormDescription>
                    Select what this key can access. Use minimal permissions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-repwell-teal-300 hover:bg-repwell-teal-400"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Key
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
