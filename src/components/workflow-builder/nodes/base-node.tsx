"use client";

import type { CSSProperties, ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getNodeConfig } from "../lib/node-registry";
import { toRelativeLabel, type WorkflowNode } from "../lib/workflow-types";

interface BaseNodeProps extends NodeProps<WorkflowNode> {
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
}

function getHandleLeft(index: number, total: number): string {
  if (total <= 1) {
    return "50%";
  }

  const step = 100 / (total + 1);
  return `${step * (index + 1)}%`;
}

function toHandleColor(className: string | undefined): string | undefined {
  if (className === "bg-emerald-500") return "rgb(16 185 129)";
  if (className === "bg-rose-500") return "rgb(244 63 94)";
  if (className === "bg-indigo-500") return "rgb(99 102 241)";
  return undefined;
}

export function BaseNode({
  id,
  type,
  data,
  selected,
  header,
  body,
  footer,
}: BaseNodeProps) {
  const normalizedData = data;
  const config = getNodeConfig(type || "");

  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const summary =
    typeof normalizedData.summary === "string" ? normalizedData.summary : "";
  const validationError =
    typeof normalizedData.__validationError === "string"
      ? normalizedData.__validationError
      : undefined;
  const validationWarning =
    typeof normalizedData.__validationWarning === "string"
      ? normalizedData.__validationWarning
      : undefined;

  const container = (
    <div
      tabIndex={0}
      aria-label={`${config.label} node`}
      className={cn(
        "group relative min-w-[220px] max-w-[260px] rounded-2xl border bg-card text-card-foreground shadow-sm transition duration-200 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected && "ring-2 ring-primary",
        validationError && "ring-2 ring-destructive"
      )}
      data-node-id={id}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1 rounded-l-2xl",
          config.accentClassName
        )}
        aria-hidden="true"
      />

      <div className="space-y-2 p-3 pl-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {toRelativeLabel(config.category)}
            </p>
            <p className="truncate text-sm font-semibold">{config.label}</p>
          </div>
        </div>

        {header}

        {body ?? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {summary || config.description}
          </p>
        )}

        {footer}

        {validationWarning && !validationError ? (
          <p className="text-[11px] font-medium text-amber-600">{validationWarning}</p>
        ) : null}
      </div>

      {config.handles.targets.map((handle, index) => (
        <Handle
          key={`target:${handle.id}`}
          id={handle.id}
          type="target"
          position={handle.position}
          style={
            handle.position === Position.Top || handle.position === Position.Bottom
              ? { left: getHandleLeft(index, config.handles.targets.length) }
              : undefined
          }
          className="!h-3 !w-3 !border-2 !border-background !bg-foreground"
          aria-label={handle.label ? `${handle.label} input handle` : "Input handle"}
        />
      ))}

      {config.handles.sources.map((handle, index) => {
        const style: CSSProperties = { backgroundColor: toHandleColor(handle.colorClassName) };
        if (handle.position === Position.Top || handle.position === Position.Bottom) {
          style.left = getHandleLeft(index, config.handles.sources.length);
        }

        return (
          <Handle
            key={`source:${handle.id}`}
            id={handle.id}
            type="source"
            position={handle.position}
            style={style}
            className="!h-3 !w-3 !border-2 !border-background !bg-primary"
            aria-label={handle.label ? `${handle.label} output handle` : "Output handle"}
          />
        );
      })}

      {config.handles.sources.some((handle) => handle.label) ? (
        <div className="pointer-events-none absolute -bottom-6 left-0 right-0 flex justify-between px-4 text-[10px] font-medium text-muted-foreground">
          {config.handles.sources.map((handle) => (
            <span key={`label:${handle.id}`}>{handle.label || ""}</span>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!validationError) {
    return container;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{container}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[240px]">
          {validationError}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
