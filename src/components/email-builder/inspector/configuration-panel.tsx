"use client";

import { useCallback } from "react";
import {
  useEditorDocumentStore,
  useSelectedBlockId,
  setDocument,
} from "../editor/editor-context";
import { TextSidebarPanel } from "./panels/text-sidebar-panel";
import { HeadingSidebarPanel } from "./panels/heading-sidebar-panel";
import { ButtonSidebarPanel } from "./panels/button-sidebar-panel";
import { ImageSidebarPanel } from "./panels/image-sidebar-panel";
import { AvatarSidebarPanel } from "./panels/avatar-sidebar-panel";
import { DividerSidebarPanel } from "./panels/divider-sidebar-panel";
import { SpacerSidebarPanel } from "./panels/spacer-sidebar-panel";
import { ContainerSidebarPanel } from "./panels/container-sidebar-panel";
import { ColumnsContainerSidebarPanel } from "./panels/columns-container-sidebar-panel";
import { HtmlSidebarPanel } from "./panels/html-sidebar-panel";
import { EmailLayoutSidebarPanel } from "./panels/email-layout-sidebar-panel";
import { HeaderSidebarPanel } from "./panels/header-sidebar-panel";
import { FooterSidebarPanel } from "./panels/footer-sidebar-panel";
import { TestimonialSidebarPanel } from "./panels/testimonial-sidebar-panel";
import { StatsSidebarPanel } from "./panels/stats-sidebar-panel";
import { FeatureListSidebarPanel } from "./panels/feature-list-sidebar-panel";
import { RatingSidebarPanel } from "./panels/rating-sidebar-panel";
import { CalloutSidebarPanel } from "./panels/callout-sidebar-panel";
import { ListSidebarPanel } from "./panels/list-sidebar-panel";
import { ButtonGroupSidebarPanel } from "./panels/button-group-sidebar-panel";
import { HeroSidebarPanel } from "./panels/hero-sidebar-panel";
import { GallerySidebarPanel } from "./panels/gallery-sidebar-panel";
import { ArticleSidebarPanel } from "./panels/article-sidebar-panel";

function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-center text-sm text-muted-foreground rounded-lg border border-dashed border-border p-6">
        {children}
      </p>
    </div>
  );
}

export function ConfigurationPanel() {
  const selectedBlockId = useSelectedBlockId();
  const block = useEditorDocumentStore(
    useCallback(
      (s) => (selectedBlockId ? s.document[selectedBlockId] : null),
      [selectedBlockId]
    )
  );

  if (!selectedBlockId) {
    return <PanelMessage>Click on a block to inspect its properties.</PanelMessage>;
  }

  if (!block) {
    return <PanelMessage>Block not found.</PanelMessage>;
  }

  const data = (block.data ?? {}) as Record<string, unknown>;

  const onUpdate = (next: Record<string, unknown>) => {
    setDocument({
      [selectedBlockId]: {
        type: block.type,
        data: { ...data, ...next },
      },
    });
  };

  switch (block.type) {
    case "Text":
      return <TextSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Heading":
      return <HeadingSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Button":
      return <ButtonSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Image":
      return <ImageSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Avatar":
      return <AvatarSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Divider":
      return <DividerSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Spacer":
      return <SpacerSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Container":
      return <ContainerSidebarPanel data={data} onUpdate={onUpdate} />;
    case "ColumnsContainer":
      return <ColumnsContainerSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Html":
      return <HtmlSidebarPanel data={data} onUpdate={onUpdate} />;
    case "EmailLayout":
      return <EmailLayoutSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Header":
      return <HeaderSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Footer":
      return <FooterSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Testimonial":
      return <TestimonialSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Stats":
      return <StatsSidebarPanel data={data} onUpdate={onUpdate} />;
    case "FeatureList":
      return <FeatureListSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Rating":
      return <RatingSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Callout":
      return <CalloutSidebarPanel data={data} onUpdate={onUpdate} />;
    case "List":
      return <ListSidebarPanel data={data} onUpdate={onUpdate} />;
    case "ButtonGroup":
      return <ButtonGroupSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Hero":
      return <HeroSidebarPanel data={data} onUpdate={onUpdate} />;
    case "Gallery":
      return <GallerySidebarPanel data={data} onUpdate={onUpdate} />;
    case "Article":
      return <ArticleSidebarPanel data={data} onUpdate={onUpdate} />;
    default:
      return <PanelMessage>No inspector panel for &quot;{block.type}&quot;.</PanelMessage>;
  }
}
