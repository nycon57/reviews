'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { createListing, updateListing } from '@/lib/listings/actions';
import type { BusinessListing, HoursOfOperation, DayHours } from '@/lib/listings/types';

interface ListingFormProps {
  listing?: BusinessListing;
  mode?: 'create' | 'edit';
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function ListingForm({ listing, mode = 'create' }: ListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [businessName, setBusinessName] = useState(listing?.businessName || '');
  const [businessPhone, setBusinessPhone] = useState(listing?.businessPhone || '');
  const [businessEmail, setBusinessEmail] = useState(listing?.businessEmail || '');
  const [businessWebsite, setBusinessWebsite] = useState(listing?.businessWebsite || '');
  const [streetAddress, setStreetAddress] = useState(listing?.streetAddress || '');
  const [streetAddress2, setStreetAddress2] = useState(listing?.streetAddress2 || '');
  const [city, setCity] = useState(listing?.city || '');
  const [state, setState] = useState(listing?.state || '');
  const [postalCode, setPostalCode] = useState(listing?.postalCode || '');
  const [businessDescription, setBusinessDescription] = useState(listing?.businessDescription || '');
  const [categories, setCategories] = useState<string[]>(listing?.businessCategories || []);
  const [keywords, setKeywords] = useState<string[]>(listing?.businessKeywords || []);
  const [newCategory, setNewCategory] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [hours, setHours] = useState<HoursOfOperation>(listing?.hoursOfOperation || {});

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleHoursChange = (day: typeof DAYS[number], field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Business name is required',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const data: Partial<BusinessListing> = {
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim() || null,
        businessEmail: businessEmail.trim() || null,
        businessWebsite: businessWebsite.trim() || null,
        streetAddress: streetAddress.trim() || null,
        streetAddress2: streetAddress2.trim() || null,
        city: city.trim() || null,
        state: state || null,
        postalCode: postalCode.trim() || null,
        businessDescription: businessDescription.trim() || null,
        businessCategories: categories,
        businessKeywords: keywords,
        hoursOfOperation: hours,
      };

      const result =
        mode === 'edit' && listing
          ? await updateListing(listing.id, data)
          : await createListing(data);

      if (result.success && result.data) {
        toast({
          title: mode === 'edit' ? 'Listing Updated' : 'Listing Created',
          description: `Successfully ${mode === 'edit' ? 'updated' : 'created'} ${businessName}`,
        });
        router.push(`/dashboard/listings/${result.data.id}`);
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${mode === 'edit' ? 'update' : 'create'} listing`,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Core business details used across all directories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your Business Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Phone</Label>
              <Input
                id="businessPhone"
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="contact@yourbusiness.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessWebsite">Website</Label>
              <Input
                id="businessWebsite"
                type="url"
                value={businessWebsite}
                onChange={(e) => setBusinessWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessDescription">Description</Label>
            <Textarea
              id="businessDescription"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Describe your business..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
          <CardDescription>Physical location for local search visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="123 Main St"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="streetAddress2">Address Line 2</Label>
            <Input
              id="streetAddress2"
              value={streetAddress2}
              onChange={(e) => setStreetAddress2(e.target.value)}
              placeholder="Suite 100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">ZIP Code</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories & Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories & Keywords</CardTitle>
          <CardDescription>Help customers find your business in search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business Categories</Label>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add a category"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1">
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add a keyword"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((kw) => (
                  <Badge key={kw} variant="outline" className="gap-1">
                    {kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hours of Operation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hours of Operation</CardTitle>
          <CardDescription>Set your business hours for each day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-4 gap-3 items-center">
                <Label className="capitalize">{day}</Label>
                <Input
                  type="time"
                  value={hours[day]?.open || ''}
                  onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="time"
                  value={hours[day]?.close || ''}
                  onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                  className="text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hours[day]?.isClosed || false}
                    onChange={(e) => handleHoursChange(day, 'isClosed', e.target.checked)}
                    className="rounded"
                  />
                  Closed
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'edit' ? 'Saving...' : 'Creating...'}
            </>
          ) : mode === 'edit' ? (
            'Save Changes'
          ) : (
            'Create Listing'
          )}
        </Button>
      </div>
    </form>
  );
}
