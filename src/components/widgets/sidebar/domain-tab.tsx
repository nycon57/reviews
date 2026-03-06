"use client";

import { Label } from "@/components/ui/label";
import { DomainAllowlistEditor } from "../domain-allowlist-editor";

interface DomainTabProps {
  allowedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
}

export function DomainTab({ allowedDomains, onDomainsChange }: DomainTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-heading mb-1 block">
          Allowed Domains
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Restrict which domains can embed this widget. Leave empty to allow all domains.
        </p>
        <DomainAllowlistEditor domains={allowedDomains} onChange={onDomainsChange} />
      </div>
    </div>
  );
}
