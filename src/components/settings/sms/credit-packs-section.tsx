'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Lightning,
  SpinnerGap,
  CheckCircle,
  Star,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fadeInUp } from '@/lib/motion/variants';
import { CREDIT_PACKS, type CreditPack } from '@/lib/sms/credits/constants';
import { purchaseCreditPack } from '@/lib/sms/credits/billing-actions';

interface CreditPacksSectionProps {
  onPurchased: () => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function perCreditCost(pack: CreditPack): string {
  return `$${(pack.priceCents / 100 / pack.credits).toFixed(3)}`;
}

export function CreditPacksSection({ onPurchased }: CreditPacksSectionProps) {
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);
    try {
      const result = await purchaseCreditPack(packId);
      if (result.success) {
        toast({
          title: 'Credits added',
          description: `Successfully added credits to your balance.`,
        });
        onPurchased();
      } else {
        toast({
          title: 'Purchase failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const bestValue = CREDIT_PACKS[CREDIT_PACKS.length - 1]; // Largest pack

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
            <Package weight="duotone" className="h-5 w-5" />
            Credit Packs
          </CardTitle>
          <p className="text-sm text-repwell-teal-300">
            Purchase additional credits for the current billing period.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => {
              const isBestValue = pack.id === bestValue.id;
              const isLoading = purchasing === pack.id;

              return (
                <div
                  key={pack.id}
                  className={`relative rounded-xl border p-5 transition-all hover:shadow-md ${
                    isBestValue
                      ? 'border-repwell-teal-300 bg-gradient-to-b from-repwell-sage-100/20 to-transparent shadow-sm'
                      : 'border-border/50 hover:border-repwell-sage-200/50'
                  }`}
                >
                  {isBestValue && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-repwell-teal-300 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                        <Star weight="fill" className="h-3 w-3" />
                        Best value
                      </span>
                    </div>
                  )}

                  <div className="text-center space-y-3">
                    <div>
                      <p className="text-3xl font-bold text-repwell-teal-500 tabular-nums">
                        {pack.credits.toLocaleString()}
                      </p>
                      <p className="text-xs text-repwell-teal-300 mt-0.5">credits</p>
                    </div>

                    <div>
                      <p className="text-xl font-semibold text-repwell-teal-500">
                        {formatCents(pack.priceCents)}
                      </p>
                      <p className="text-[10px] text-repwell-teal-300">
                        {perCreditCost(pack)} per credit
                      </p>
                    </div>

                    <Button
                      onClick={() => handlePurchase(pack.id)}
                      disabled={purchasing !== null}
                      size="sm"
                      className={`w-full ${
                        isBestValue
                          ? 'bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white'
                          : 'bg-repwell-sage-100/50 hover:bg-repwell-sage-100 text-repwell-teal-500 border border-repwell-sage-200/30'
                      }`}
                    >
                      {isLoading ? (
                        <SpinnerGap className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Lightning weight="bold" className="h-3.5 w-3.5 mr-1.5" />
                          Buy now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-repwell-teal-300">
            <CheckCircle weight="duotone" className="h-3.5 w-3.5 flex-shrink-0" />
            Credits are added instantly and apply to the current billing period.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
