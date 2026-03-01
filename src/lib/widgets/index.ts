// Types
export type {
  WidgetConfig,
  WidgetConfigInsert,
  WidgetConfigUpdate,
  WidgetType,
  WidgetEntityType,
  WidgetStatus,
  ActionResult,
  PaginatedResult,
} from "./types";

// Schemas
export {
  WIDGET_TYPES,
  WIDGET_ENTITY_TYPES,
  WIDGET_STATUSES,
  widgetConfigJsonSchema,
  updateWidgetInputSchema,
  listWidgetsInputSchema,
  getWidgetInputSchema,
} from "./schemas";

export type {
  WidgetConfigJson,
  UpdateWidgetInput,
  ListWidgetsInput,
  GetWidgetInput,
} from "./schemas";

// Actions
export {
  updateWidget,
  listWidgets,
  getWidget,
} from "./actions";
