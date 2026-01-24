"use client";

import * as React from "react";
import {
  Envelope as Mail,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

interface ContactCardProps {
  /** Card title */
  title?: string;
  /** Contact information */
  contact: ContactInfo;
  /** Additional className */
  className?: string;
}

export function ContactCard({
  title = "Contact Us",
  contact,
  className,
}: ContactCardProps) {
  return (
    <div
      className={cn(
        "my-8 p-6 rounded-2xl bg-gradient-to-br from-repwell-sage-100/50 to-repwell-sage-100/30 border border-repwell-sage-100",
        className
      )}
    >
      <h3 className="font-display text-xl font-semibold text-repwell-teal-500 mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-3 text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
          >
            <Mail className="h-5 w-5 flex-shrink-0" />
            <span>{contact.email}</span>
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone.replace(/\D/g, "")}`}
            className="flex items-center gap-3 text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
          >
            <Phone className="h-5 w-5 flex-shrink-0" />
            <span>{contact.phone}</span>
          </a>
        )}
        {contact.address && (
          <p className="flex items-center gap-3 text-repwell-teal-400">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span>{contact.address}</span>
          </p>
        )}
      </div>
    </div>
  );
}
