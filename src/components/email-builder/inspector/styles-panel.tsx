"use client";

import { useEditorDocumentStore, setDocument } from "../editor/editor-context";
import { EmailLayoutSidebarPanel } from "./panels/email-layout-sidebar-panel";

/**
 * Styles panel: renders the global email layout settings
 * from the root EmailLayout block in the Waypoint document.
 */
export function StylesPanel() {
  const root = useEditorDocumentStore((s) => s.document.root);

  if (!root) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No root layout block found.
      </div>
    );
  }

  const data = (root.data ?? {}) as Record<string, unknown>;

  return (
    <EmailLayoutSidebarPanel
      data={{
        backdropColor: data.backdropColor as string | null | undefined,
        canvasColor: data.canvasColor as string | null | undefined,
        textColor: data.textColor as string | null | undefined,
        fontFamily: data.fontFamily as string | null | undefined,
      }}
      onUpdate={(next) => {
        setDocument({
          root: {
            type: root.type,
            data: { ...data, ...next },
          },
        });
      }}
    />
  );
}
