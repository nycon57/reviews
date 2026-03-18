"use client";

import { useState, useCallback, useMemo } from "react";
import type { TReaderDocument } from "@usewaypoint/email-builder";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SamplesDrawer, SAMPLES_DRAWER_WIDTH } from "./samples-drawer";
import type { SampleTemplate } from "./samples-drawer";
import { TemplatePanel } from "./template-panel";
import type { EditorTab } from "./main-tabs-group";

/** Width of the right inspector drawer in px */
const INSPECTOR_DRAWER_WIDTH = 320;

/**
 * Default empty Waypoint document.
 * The "root" block is an EmailLayout container with no children.
 */
const EMPTY_DOCUMENT: TReaderDocument = {
  root: {
    type: "EmailLayout",
    data: {
      backdropColor: "#f8faf8",
      canvasColor: "#ffffff",
      textColor: "#2f3e46",
      fontFamily: "MODERN_SANS",
      childrenIds: [],
    },
  },
};

/**
 * Built-in sample templates for the samples drawer.
 */
const DEFAULT_SAMPLES: SampleTemplate[] = [
  {
    label: "Empty",
    document: EMPTY_DOCUMENT,
  },
  {
    label: "Welcome",
    document: {
      root: {
        type: "EmailLayout",
        data: {
          backdropColor: "#f8faf8",
          canvasColor: "#ffffff",
          textColor: "#2f3e46",
          fontFamily: "MODERN_SANS",
          childrenIds: ["heading-1", "text-1", "button-1"],
        },
      },
      "heading-1": {
        type: "Heading",
        data: {
          props: { text: "Welcome!" },
          style: {
            fontWeight: "bold",
            textAlign: "center" as const,
            padding: { top: 24, bottom: 8, left: 24, right: 24 },
          },
        },
      },
      "text-1": {
        type: "Text",
        data: {
          props: {
            text: "Thanks for signing up. We are excited to have you on board.",
          },
          style: {
            padding: { top: 8, bottom: 16, left: 24, right: 24 },
          },
        },
      },
      "button-1": {
        type: "Button",
        data: {
          props: { text: "Get Started", url: "#" },
          style: {
            padding: { top: 8, bottom: 24, left: 24, right: 24 },
          },
        },
      },
    },
  },
  {
    label: "Newsletter",
    document: {
      root: {
        type: "EmailLayout",
        data: {
          backdropColor: "#f0f4f1",
          canvasColor: "#ffffff",
          textColor: "#2f3e46",
          fontFamily: "MODERN_SANS",
          childrenIds: ["heading-1", "divider-1", "text-1", "text-2", "button-1"],
        },
      },
      "heading-1": {
        type: "Heading",
        data: {
          props: { text: "Monthly Newsletter" },
          style: {
            fontWeight: "bold",
            textAlign: "center" as const,
            padding: { top: 32, bottom: 8, left: 24, right: 24 },
          },
        },
      },
      "divider-1": {
        type: "Divider",
        data: {
          style: {
            padding: { top: 8, bottom: 8, left: 24, right: 24 },
          },
        },
      },
      "text-1": {
        type: "Text",
        data: {
          props: {
            text: "Here is your monthly update with the latest news and highlights.",
          },
          style: {
            padding: { top: 8, bottom: 8, left: 24, right: 24 },
          },
        },
      },
      "text-2": {
        type: "Text",
        data: {
          props: {
            text: "Add your content sections here to keep your audience engaged.",
          },
          style: {
            padding: { top: 8, bottom: 16, left: 24, right: 24 },
          },
        },
      },
      "button-1": {
        type: "Button",
        data: {
          props: { text: "Read More", url: "#" },
          style: {
            padding: { top: 8, bottom: 32, left: 24, right: 24 },
          },
        },
      },
    },
  },
  {
    label: "Review Request",
    document: {
      root: {
        type: "EmailLayout",
        data: {
          backdropColor: "#f8faf8",
          canvasColor: "#ffffff",
          textColor: "#2f3e46",
          fontFamily: "MODERN_SANS",
          childrenIds: ["heading-1", "text-1", "button-1", "text-2"],
        },
      },
      "heading-1": {
        type: "Heading",
        data: {
          props: { text: "How was your experience?" },
          style: {
            fontWeight: "bold",
            textAlign: "center" as const,
            padding: { top: 32, bottom: 8, left: 24, right: 24 },
          },
        },
      },
      "text-1": {
        type: "Text",
        data: {
          props: {
            text: "We value your feedback. Please take a moment to share your experience with us.",
          },
          style: {
            textAlign: "center" as const,
            padding: { top: 8, bottom: 16, left: 24, right: 24 },
          },
        },
      },
      "button-1": {
        type: "Button",
        data: {
          props: { text: "Leave a Review", url: "#" },
          style: {
            padding: { top: 8, bottom: 16, left: 24, right: 24 },
          },
        },
      },
      "text-2": {
        type: "Text",
        data: {
          props: { text: "It only takes a minute. Thank you!" },
          style: {
            fontSize: 14,
            color: "#52796f",
            textAlign: "center" as const,
            padding: { top: 8, bottom: 32, left: 24, right: 24 },
          },
        },
      },
    },
  },
  {
    label: "Minimal",
    document: {
      root: {
        type: "EmailLayout",
        data: {
          backdropColor: "#ffffff",
          canvasColor: "#ffffff",
          textColor: "#2f3e46",
          fontFamily: "MODERN_SANS",
          childrenIds: ["text-1"],
        },
      },
      "text-1": {
        type: "Text",
        data: {
          props: {
            text: "Write your message here. Keep it simple and focused.",
          },
          style: {
            padding: { top: 32, bottom: 32, left: 24, right: 24 },
          },
        },
      },
    },
  },
];

interface EmailEditorProps {
  /** Initial document to load into the editor */
  initialDocument?: TReaderDocument;
  /** Callback when user saves */
  onSave?: (document: TReaderDocument) => void;
  /** Display name for the template */
  templateName?: string;
  /** Additional sample templates to display in the drawer */
  samples?: SampleTemplate[];
  /** Render the inspector drawer content (right side) */
  inspectorContent?: React.ReactNode;
  /** Render the editor content for the editor tab (center) */
  editorContent?: React.ReactNode;
}

export function EmailEditor({
  initialDocument,
  onSave: _onSave,
  templateName: _templateName,
  samples: externalSamples,
  inspectorContent,
  editorContent,
}: EmailEditorProps) {
  const [document, setDocument] = useState<TReaderDocument>(
    initialDocument ?? EMPTY_DOCUMENT
  );
  const [activeTab, setActiveTab] = useState<EditorTab>("editor");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [samplesOpen, setSamplesOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [selectedSampleLabel, setSelectedSampleLabel] = useState<string>();

  const allSamples = useMemo(
    () => externalSamples ?? DEFAULT_SAMPLES,
    [externalSamples]
  );

  const handleSelectSample = useCallback(
    (doc: TReaderDocument) => {
      setDocument(doc);
    },
    []
  );

  const handleImport = useCallback(
    (doc: TReaderDocument) => {
      setDocument(doc);
      setSelectedSampleLabel(undefined);
    },
    []
  );

  const handleToggleSamples = useCallback(() => {
    setSamplesOpen((prev) => !prev);
  }, []);

  const handleToggleInspector = useCallback(() => {
    setInspectorOpen((prev) => !prev);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex h-screen w-full overflow-hidden bg-muted/20">
        {/* Left: Samples Drawer */}
        <SamplesDrawer
          open={samplesOpen}
          samples={allSamples}
          selectedLabel={selectedSampleLabel}
          onSelectSample={(doc) => {
            const match = allSamples.find((s) => s.document === doc);
            setSelectedSampleLabel(match?.label);
            handleSelectSample(doc);
          }}
        />

        {/* Center: Template Panel */}
        <div
          className="flex flex-1 flex-col transition-[margin] duration-300 ease-in-out"
          style={{
            marginLeft: samplesOpen ? SAMPLES_DRAWER_WIDTH : 0,
            marginRight: inspectorOpen ? INSPECTOR_DRAWER_WIDTH : 0,
          }}
        >
          <TemplatePanel
            document={document}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            viewport={viewport}
            onViewportChange={setViewport}
            samplesOpen={samplesOpen}
            onToggleSamples={handleToggleSamples}
            inspectorOpen={inspectorOpen}
            onToggleInspector={handleToggleInspector}
            onImport={handleImport}
            editorContent={editorContent}
          />
        </div>

        {/* Right: Inspector Drawer */}
        <div
          className="fixed right-0 top-0 z-20 flex h-full flex-col border-l border-border bg-background transition-transform duration-300 ease-in-out"
          style={{
            width: INSPECTOR_DRAWER_WIDTH,
            transform: inspectorOpen ? "translateX(0)" : `translateX(100%)`,
          }}
        >
          {inspectorContent ?? (
            <div className="flex flex-1 flex-col">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Inspector
                </h3>
              </div>
              <div className="flex-1 p-4">
                <p className="text-sm text-muted-foreground">
                  Select an element to edit its properties.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export type { SampleTemplate, EditorTab, TReaderDocument };
