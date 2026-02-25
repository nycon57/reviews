"use client";

import { useMemo, useState } from "react";
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  NODE_CATEGORY_LABELS,
  NODE_CATEGORY_ORDER,
  getCategoryNodeTypes,
} from "./lib/node-registry";

interface NodePaletteProps {
  readOnly?: boolean;
}

const DRAG_DATA_KEY = "application/workflow-node-type";

export function NodePalette({ readOnly = false }: NodePaletteProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return NODE_CATEGORY_ORDER.map((category) => {
      const items = getCategoryNodeTypes(category).filter((nodeType) => {
        if (!query.trim()) {
          return true;
        }

        const haystack = `${nodeType.label} ${nodeType.description}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      });

      return {
        category,
        items,
      };
    }).filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-200",
        isCollapsed ? "w-12" : "w-60"
      )}
    >
      <div className="flex h-12 items-center justify-between border-b px-2">
        {!isCollapsed ? <p className="text-sm font-semibold">Node Palette</p> : <span />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label={isCollapsed ? "Expand node palette" : "Collapse node palette"}
        >
          {isCollapsed ? (
            <CaretDoubleRight className="h-4 w-4" />
          ) : (
            <CaretDoubleLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isCollapsed ? (
        <TooltipProvider>
          <div className="flex flex-1 flex-col items-center gap-2 py-3">
            {NODE_CATEGORY_ORDER.map((category) => {
              const first = getCategoryNodeTypes(category)[0];
              if (!first) return null;
              const Icon = first.icon;
              return (
                <Tooltip key={category}>
                  <TooltipTrigger asChild>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {NODE_CATEGORY_LABELS[category]}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      ) : (
        <>
          <div className="border-b p-3">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search nodes..."
                className="pl-8"
                aria-label="Filter workflow nodes"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <Accordion type="multiple" defaultValue={NODE_CATEGORY_ORDER} className="space-y-2">
              {filtered.map((group) => (
                <AccordionItem key={group.category} value={group.category} className="rounded-lg border px-2">
                  <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide">
                    {NODE_CATEGORY_LABELS[group.category]}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-2">
                    <TooltipProvider>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Tooltip key={item.type}>
                            <TooltipTrigger asChild>
                              <div
                                draggable={!readOnly}
                                onDragStart={(event) => {
                                  event.dataTransfer.setData(DRAG_DATA_KEY, item.type);
                                  event.dataTransfer.effectAllowed = "move";
                                }}
                                className={cn(
                                  "flex cursor-grab items-center gap-2 rounded-md border bg-background p-2 text-left transition",
                                  "hover:border-primary hover:bg-primary/5",
                                  readOnly && "cursor-not-allowed opacity-50"
                                )}
                                aria-label={`Drag ${item.label} node`}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="flex h-7 w-7 items-center justify-center rounded bg-muted">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">{item.label}</p>
                                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[220px] text-xs">
                              {item.description}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </>
      )}
    </aside>
  );
}

export const WORKFLOW_NODE_DRAG_DATA_KEY = DRAG_DATA_KEY;
