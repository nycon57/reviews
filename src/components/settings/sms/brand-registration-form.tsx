'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Buildings,
  IdentificationCard,
  Globe,
  MapPin,
  ArrowRight,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  brandRegistrationSchema,
  type BrandRegistrationInput,
  INDUSTRY_VERTICALS,
} from '@/lib/sms/registration/schemas';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
] as const;

interface BrandRegistrationFormProps {
  onSubmit: (data: BrandRegistrationInput) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: Partial<BrandRegistrationInput>;
}

export function BrandRegistrationForm({
  onSubmit,
  isSubmitting,
  defaultValues,
}: BrandRegistrationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandRegistrationInput>({
    resolver: zodResolver(brandRegistrationSchema),
    defaultValues: {
      country: 'US',
      companyType: 'private',
      vertical: 'FINANCIAL',
      ...defaultValues,
    },
  });

  const companyType = watch('companyType');
  const vertical = watch('vertical');
  const state = watch('state');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-repwell-teal-500">
          <Buildings weight="duotone" className="h-4 w-4" />
          Company Information
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="legalCompanyName" className="text-sm font-medium text-repwell-teal-500">
              Legal Company Name
            </Label>
            <Input
              id="legalCompanyName"
              {...register('legalCompanyName')}
              placeholder="Acme Mortgage LLC"
              className="mt-1.5"
            />
            {errors.legalCompanyName && (
              <p className="text-xs text-red-500 mt-1">{errors.legalCompanyName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="companyType" className="text-sm font-medium text-repwell-teal-500">
              Company Type
            </Label>
            <Select
              value={companyType}
              onValueChange={(v) => setValue('companyType', v as BrandRegistrationInput['companyType'])}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private Company</SelectItem>
                <SelectItem value="public">Public Company</SelectItem>
                <SelectItem value="non_profit">Non-Profit</SelectItem>
              </SelectContent>
            </Select>
            {errors.companyType && (
              <p className="text-xs text-red-500 mt-1">{errors.companyType.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="vertical" className="text-sm font-medium text-repwell-teal-500">
              Industry
            </Label>
            <Select value={vertical} onValueChange={(v) => setValue('vertical', v)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_VERTICALS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vertical && (
              <p className="text-xs text-red-500 mt-1">{errors.vertical.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-repwell-teal-500">
          <IdentificationCard weight="duotone" className="h-4 w-4" />
          Tax &amp; Legal
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="einTaxId" className="text-sm font-medium text-repwell-teal-500">
              EIN / Tax ID
            </Label>
            <Input
              id="einTaxId"
              {...register('einTaxId')}
              placeholder="XX-XXXXXXX"
              className="mt-1.5 font-mono"
            />
            {errors.einTaxId && (
              <p className="text-xs text-red-500 mt-1">{errors.einTaxId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="stockTicker" className="text-sm font-medium text-repwell-teal-500">
              Stock Ticker <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="stockTicker"
              {...register('stockTicker')}
              placeholder="ACME"
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Website */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-repwell-teal-500">
          <Globe weight="duotone" className="h-4 w-4" />
          Website
        </div>

        <div>
          <Label htmlFor="websiteUrl" className="text-sm font-medium text-repwell-teal-500">
            Company Website
          </Label>
          <Input
            id="websiteUrl"
            {...register('websiteUrl')}
            placeholder="https://www.example.com"
            className="mt-1.5"
          />
          {errors.websiteUrl && (
            <p className="text-xs text-red-500 mt-1">{errors.websiteUrl.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-repwell-teal-500">
          <MapPin weight="duotone" className="h-4 w-4" />
          Company Address
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="street" className="text-sm font-medium text-repwell-teal-500">
              Street Address
            </Label>
            <Input
              id="street"
              {...register('street')}
              placeholder="123 Main St"
              className="mt-1.5"
            />
            {errors.street && (
              <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="city" className="text-sm font-medium text-repwell-teal-500">
              City
            </Label>
            <Input id="city" {...register('city')} placeholder="Austin" className="mt-1.5" />
            {errors.city && (
              <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="state" className="text-sm font-medium text-repwell-teal-500">
                State
              </Label>
              <Select value={state || ''} onValueChange={(v) => setValue('state', v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="postalCode" className="text-sm font-medium text-repwell-teal-500">
                ZIP Code
              </Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                placeholder="78701"
                className="mt-1.5"
              />
              {errors.postalCode && (
                <p className="text-xs text-red-500 mt-1">{errors.postalCode.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/50">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
        >
          {isSubmitting ? (
            <>
              <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Brand Registration
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
