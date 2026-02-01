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
  createWidgetInputSchema,
  updateWidgetInputSchema,
  deleteWidgetInputSchema,
  listWidgetsInputSchema,
  getWidgetInputSchema,
  duplicateWidgetInputSchema,
} from "./schemas";

export type {
  WidgetConfigJson,
  CreateWidgetInput,
  UpdateWidgetInput,
  DeleteWidgetInput,
  ListWidgetsInput,
  GetWidgetInput,
  DuplicateWidgetInput,
} from "./schemas";

// Actions
export {
  createWidget,
  updateWidget,
  deleteWidget,
  listWidgets,
  getWidget,
  duplicateWidget,
} from "./actions";
