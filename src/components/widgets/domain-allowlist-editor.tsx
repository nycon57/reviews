"use client";

import { useState, useCallback } from "react";
import { Plus, X, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidHostname } from "@/lib/widgets/domain-validation";

interface DomainAllowlistEditorProps {
  domains: string[];
  onChange: (domains: string[]) => void;
}

export function DomainAllowlistEditor({ domains, onChange }: DomainAllowlistEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addDomain = useCallback(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return;

    // Strip protocol if pasted with one
    const cleaned = trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    if (!isValidHostname(cleaned)) {
      setError("Enter a valid domain (e.g., example.com or *.example.com)");
      return;
    }

    if (domains.includes(cleaned)) {
      setError("Domain already added");
      return;
    }

    onChange([...domains, cleaned]);
    setInputValue("");
    setError(null);
  }, [inputValue, domains, onChange]);

  const removeDomain = useCallback(
    (domain: string) => {
      onChange(domains.filter((d) => d !== domain));
    },
    [domains, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDomain();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="example.com or *.example.com"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDomain}
          className="flex-shrink-0"
        >
          <Plus size={16} />
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {domains.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          No domain restrictions. Widget will load on any domain.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
                bg-repwell-sage-100/40 text-repwell-teal-400 rounded-md border border-repwell-sage-200/50"
            >
              <Globe size={12} className="text-repwell-teal-300" />
              {domain}
              <button
                type="button"
                onClick={() => removeDomain(domain)}
                className="ml-0.5 text-repwell-teal-400/50 hover:text-red-500 transition-colors"
                aria-label={`Remove ${domain}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
