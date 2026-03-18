"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useSelectedSidebarTab,
  setSidebarTab,
} from "../editor/editor-context";
import { StylesPanel } from "./styles-panel";
import { ConfigurationPanel } from "./configuration-panel";

export const INSPECTOR_DRAWER_WIDTH = 320;

interface InspectorDrawerProps {
  isOpen: boolean;
}

export function InspectorDrawer({ isOpen }: InspectorDrawerProps) {
  const sidebarTab = useSelectedSidebarTab();
  // Map store values to tab UI values
  const activeTab = sidebarTab === "block-configuration" ? "inspect" : "styles";

  return (
    <div
      className={`relative h-full shrink-0 overflow-hidden border-l border-border bg-background transition-all duration-300 ${
        isOpen ? "w-80" : "w-0 border-l-0"
      }`}
      style={{ minWidth: isOpen ? INSPECTOR_DRAWER_WIDTH : 0 }}
    >
      <div className="flex h-full w-80 flex-col">
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setSidebarTab(v === "inspect" ? "block-configuration" : "styles")
          }
          className="flex h-full flex-col"
        >
          <div className="shrink-0 border-b border-border px-2 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="inspect" className="flex-1">
                Inspect
              </TabsTrigger>
              <TabsTrigger value="styles" className="flex-1">
                Styles
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="flex-1">
            <TabsContent value="inspect" className="mt-0">
              <ConfigurationPanel />
            </TabsContent>
            <TabsContent value="styles" className="mt-0">
              <StylesPanel />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
