'use client';

import { useState, useTransition } from 'react';
import {
  Phone,
  MagnifyingGlass,
  MapPin,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  searchAvailableNumbers,
  purchasePhoneNumber,
} from '@/lib/sms/settings/actions';
import type { AvailablePhoneNumber } from '@/lib/sms/types';

function formatPhoneNumber(e164: string): string {
  const digits = e164.replace(/^\+1/, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return e164;
}

interface AddPhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPhoneNumberDialog({ open, onOpenChange, onSuccess }: AddPhoneNumberDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [areaCode, setAreaCode] = useState('');
  const [numberType, setNumberType] = useState<'local' | 'toll_free'>('local');
  const [results, setResults] = useState<AvailablePhoneNumber[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);

  function resetState() {
    setAreaCode('');
    setNumberType('local');
    setResults([]);
    setHasSearched(false);
    setPurchasingNumber(null);
  }

  async function handleSearch() {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const result = await searchAvailableNumbers({
        areaCode: areaCode || undefined,
        numberType,
      });
      if (result.success) {
        setResults(result.data ?? []);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }

  async function handlePurchase(phoneNumber: string) {
    setPurchasingNumber(phoneNumber);
    startTransition(async () => {
      const result = await purchasePhoneNumber({ phoneNumber });
      if (result.success) {
        toast({
          title: 'Number purchased',
          description: `${formatPhoneNumber(phoneNumber)} has been added to your account.`,
        });
        resetState();
        onSuccess();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
        setPurchasingNumber(null);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetState();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-repwell-teal-500">
            <Phone weight="duotone" className="h-5 w-5" />
            Add Phone Number
          </DialogTitle>
          <DialogDescription>
            Search for available phone numbers and provision them to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Search Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="areaCode" className="text-sm font-medium text-repwell-teal-500">
                Area Code
                <span className="text-muted-foreground font-normal"> (optional)</span>
              </Label>
              <Input
                id="areaCode"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 415"
                className="mt-1.5"
                maxLength={3}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-repwell-teal-500">Number Type</Label>
              <Select value={numberType} onValueChange={(v) => setNumberType(v as 'local' | 'toll_free')}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="toll_free">Toll-Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
          >
            {isSearching ? (
              <>
                <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <MagnifyingGlass className="h-4 w-4 mr-2" />
                Search Available Numbers
              </>
            )}
          </Button>

          {/* Results */}
          {hasSearched && (
            <div className="border-t border-border/50 pt-4">
              {results.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  {isSearching ? 'Searching...' : 'No numbers found. Try a different area code or type.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <p className="text-xs text-muted-foreground mb-2">
                    {results.length} number{results.length !== 1 ? 's' : ''} available
                  </p>
                  {results.map((num) => (
                    <div
                      key={num.phoneNumber}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-medium text-repwell-teal-500">
                          {formatPhoneNumber(num.phoneNumber)}
                        </p>
                        <div className="flex items-center gap-2">
                          {num.locality && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {num.locality}, {num.region}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            {num.capabilities.sms && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">SMS</Badge>
                            )}
                            {num.capabilities.mms && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">MMS</Badge>
                            )}
                            {num.capabilities.voice && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Voice</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(num.phoneNumber)}
                        disabled={isPending || purchasingNumber !== null}
                        className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white text-xs"
                      >
                        {purchasingNumber === num.phoneNumber ? (
                          <>
                            <ArrowsClockwise className="h-3 w-3 mr-1 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Provision'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
