"use client";

import { createContext, useContext } from "react";
import type { EmailBrandingConfig } from "@/lib/organization/types";

interface EmailBrandingContextValue {
  branding: EmailBrandingConfig | null;
  orgLogoUrl: string | null;
}

const EmailBrandingContext = createContext<EmailBrandingContextValue>({
  branding: null,
  orgLogoUrl: null,
});

export function EmailBrandingProvider({
  branding,
  orgLogoUrl,
  children,
}: {
  branding: EmailBrandingConfig | null;
  orgLogoUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <EmailBrandingContext.Provider value={{ branding, orgLogoUrl }}>
      {children}
    </EmailBrandingContext.Provider>
  );
}

export function useEmailBranding() {
  return useContext(EmailBrandingContext);
}
