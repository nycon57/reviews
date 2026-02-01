"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, User, Building2, Briefcase, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchEntities, type EntitySearchResult } from "@/lib/widgets/actions";
import type { WidgetEntityType } from "@/lib/widgets/types";

interface EntitySelectorProps {
  entityType: WidgetEntityType;
  entityId: string | null;
  onSelect: (entityId: string, entityName: string) => void;
  label?: string;
}

const ENTITY_ICONS: Record<WidgetEntityType, typeof User> = {
  user: User,
  branch: Building2,
  organization: Briefcase,
};

const ENTITY_LABELS: Record<WidgetEntityType, string> = {
  user: "Loan Officer",
  branch: "Branch",
  organization: "Organization",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EntitySelector({
  entityType,
  entityId,
  onSelect,
  label,
}: EntitySelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const Icon = ENTITY_ICONS[entityType];

  // Load initial results on mount or entity type change
  useEffect(() => {
    setSelectedName(null);
    setQuery("");
    loadEntities("");
  }, [entityType]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadEntities = useCallback(
    async (search: string) => {
      setIsLoading(true);
      const result = await searchEntities(entityType, search);
      if (result.success) {
        setResults(result.data);
        // If we have an entityId, find and set the name
        if (entityId && !selectedName) {
          const match = result.data.find((e) => e.id === entityId);
          if (match) setSelectedName(match.name);
        }
      }
      setIsLoading(false);
    },
    [entityType, entityId, selectedName]
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadEntities(value);
    }, 300);
  };

  const handleSelect = (entity: EntitySearchResult) => {
    setSelectedName(entity.name);
    setIsOpen(false);
    setQuery("");
    onSelect(entity.id, entity.name);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      )}

      {/* Selected entity display / search input */}
      <div
        className="flex items-center gap-2 h-8 px-2 text-xs border border-border rounded-md
          bg-white cursor-pointer hover:border-repwell-sage-200 transition-colors"
        onClick={() => {
          setIsOpen(true);
          loadEntities(query);
        }}
      >
        <Search size={14} className="text-muted-foreground flex-shrink-0" />
        {isOpen ? (
          <Input
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={`Search ${ENTITY_LABELS[entityType].toLowerCase()}s...`}
            className="h-6 border-0 p-0 text-xs focus-visible:ring-0 shadow-none"
            autoFocus
          />
        ) : (
          <span
            className={`truncate ${selectedName ? "text-repwell-teal-400" : "text-muted-foreground"}`}
          >
            {selectedName ?? `Select a ${ENTITY_LABELS[entityType].toLowerCase()}...`}
          </span>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto
            bg-white border border-border rounded-md shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No {ENTITY_LABELS[entityType].toLowerCase()}s found.
            </div>
          ) : (
            results.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => handleSelect(entity)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left
                  hover:bg-repwell-sage-100/30 transition-colors ${
                    entity.id === entityId
                      ? "bg-repwell-sage-100/50"
                      : ""
                  }`}
              >
                {entity.avatarUrl ? (
                  <img
                    src={entity.avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-repwell-sage-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-repwell-teal-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-repwell-teal-400 truncate">
                    {entity.name}
                  </div>
                  {entity.subtitle && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {entity.subtitle}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
