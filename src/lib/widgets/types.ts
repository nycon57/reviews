import type { Database } from "@/types/database.types";

export type WidgetConfig = Database["public"]["Tables"]["widget_configs"]["Row"];
export type WidgetConfigInsert =
  Database["public"]["Tables"]["widget_configs"]["Insert"];
export type WidgetConfigUpdate =
  Database["public"]["Tables"]["widget_configs"]["Update"];

export type WidgetType = Database["public"]["Enums"]["widget_type"];
export type WidgetEntityType = Database["public"]["Enums"]["widget_entity_type"];
export type WidgetStatus = Database["public"]["Enums"]["widget_status"];

/** Discriminated union for server action responses */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
