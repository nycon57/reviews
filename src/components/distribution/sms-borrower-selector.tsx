"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toE164, formatForDisplay } from "@/lib/sms/phone-utils";
import {
  User,
  Phone,
  CheckCircle,
  Warning,
} from "@phosphor-icons/react";

interface SmsBorrowerSelectorProps {
  borrowerName: string;
  borrowerPhone: string;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  phoneValidation: { valid: boolean; display: string | null } | null;
}

export function SmsBorrowerSelector({
  borrowerName,
  borrowerPhone,
  onNameChange,
  onPhoneChange,
  phoneValidation,
}: SmsBorrowerSelectorProps) {
  const [phoneTouched, setPhoneTouched] = useState(false);

  const handlePhoneBlur = useCallback(() => {
    setPhoneTouched(true);
    // Auto-format to display format if valid
    const e164 = toE164(borrowerPhone);
    if (e164) {
      onPhoneChange(formatForDisplay(e164));
    }
  }, [borrowerPhone, onPhoneChange]);

  const showPhoneError = phoneTouched && borrowerPhone.length > 0 && phoneValidation && !phoneValidation.valid;
  const showPhoneValid = phoneValidation?.valid && borrowerPhone.length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="sms-borrower-name" className="text-sm font-medium">
          Borrower name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="sms-borrower-name"
            placeholder="John Smith"
            value={borrowerName}
            onChange={(e) => onNameChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sms-borrower-phone" className="text-sm font-medium">
          Phone number
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="sms-borrower-phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={borrowerPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            className={`pl-9 pr-10 ${showPhoneError ? "border-destructive" : ""}`}
          />
          {showPhoneValid && (
            <CheckCircle
              weight="fill"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500"
            />
          )}
          {showPhoneError && (
            <Warning
              weight="fill"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive"
            />
          )}
        </div>
        {showPhoneError && (
          <p className="text-xs text-destructive">
            Enter a valid US phone number
          </p>
        )}
        {showPhoneValid && phoneValidation?.display && (
          <p className="text-xs text-muted-foreground">
            Will send to {phoneValidation.display}
          </p>
        )}
      </div>
    </div>
  );
}
