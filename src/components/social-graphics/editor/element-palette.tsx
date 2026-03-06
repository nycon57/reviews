"use client";

import { useCallback } from "react";
import {
  Type,
  Star,
  Square,
  Circle,
  Image,
  BarChart3,
  Smile,
  Quote,
  User,
  Building2,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CanvasElement, ElementType, ShapeType } from "@/lib/social-graphics/types";
import type { EditorActions } from "./use-editor-state";
import { generateElementId } from "./use-editor-state";

interface ElementPaletteProps {
  editor: EditorActions;
}

interface PaletteItem {
  label: string;
  icon: React.ReactNode;
  create: () => CanvasElement;
}

function makeElement(
  type: ElementType,
  overrides: Partial<CanvasElement> = {}
): CanvasElement {
  return {
    id: generateElementId(),
    type,
    x: 0.1,
    y: 0.1,
    width: 0.3,
    height: 0.1,
    rotation: 0,
    zIndex: 100,
    opacity: 1,
    locked: false,
    visible: true,
    ...overrides,
  };
}

const TEXT_ITEMS: PaletteItem[] = [
  {
    label: "Review Quote",
    icon: <Quote className="h-4 w-4" />,
    create: () =>
      makeElement("text", {
        text: '"Great experience working with this team!"',
        fontSize: 24,
        fontWeight: "500",
        fontFamily: "Georgia, serif",
        color: "#2f3e46",
        width: 0.7,
        height: 0.15,
        textAlign: "center",
      }),
  },
  {
    label: "Custom Text",
    icon: <Type className="h-4 w-4" />,
    create: () =>
      makeElement("text", {
        text: "Your text here",
        fontSize: 18,
        fontWeight: "400",
        color: "#2f3e46",
        width: 0.4,
        height: 0.08,
      }),
  },
  {
    label: "Reviewer Name",
    icon: <User className="h-4 w-4" />,
    create: () =>
      makeElement("text", {
        text: "John D.",
        fontSize: 16,
        fontWeight: "600",
        color: "#354f52",
        width: 0.25,
        height: 0.05,
      }),
  },
];

const VISUAL_ITEMS: PaletteItem[] = [
  {
    label: "Star Rating",
    icon: <Star className="h-4 w-4" />,
    create: () =>
      makeElement("rating", {
        rating: 5,
        starColor: "#f5c518",
        starSize: 28,
        width: 0.25,
        height: 0.06,
      }),
  },
  {
    label: "NPS Score",
    icon: <Hash className="h-4 w-4" />,
    create: () =>
      makeElement("stats", {
        statValue: "78",
        statLabel: "NPS Score",
        fontSize: 20,
        color: "#52796f",
        width: 0.2,
        height: 0.12,
      }),
  },
  {
    label: "Stats Block",
    icon: <BarChart3 className="h-4 w-4" />,
    create: () =>
      makeElement("stats", {
        statValue: "4.8 avg / 1,234 reviews",
        statLabel: "Overall Rating",
        fontSize: 16,
        color: "#2f3e46",
        width: 0.35,
        height: 0.1,
      }),
  },
];

const SHAPE_ITEMS: PaletteItem[] = [
  {
    label: "Rectangle",
    icon: <Square className="h-4 w-4" />,
    create: () =>
      makeElement("shape", {
        shape: "rectangle" as ShapeType,
        backgroundColor: "#cad2c5",
        borderWidth: 0,
        width: 0.3,
        height: 0.15,
      }),
  },
  {
    label: "Circle",
    icon: <Circle className="h-4 w-4" />,
    create: () =>
      makeElement("shape", {
        shape: "circle" as ShapeType,
        backgroundColor: "#84a98c",
        borderWidth: 0,
        width: 0.15,
        height: 0.15,
      }),
  },
  {
    label: "Rounded Rect",
    icon: <Square className="h-4 w-4 rounded" />,
    create: () =>
      makeElement("shape", {
        shape: "rounded-rect" as ShapeType,
        backgroundColor: "#52796f",
        borderRadius: 16,
        borderWidth: 0,
        width: 0.3,
        height: 0.15,
      }),
  },
];

const IMAGE_ITEMS: PaletteItem[] = [
  {
    label: "Reviewer Photo",
    icon: <User className="h-4 w-4" />,
    create: () =>
      makeElement("image", {
        imageUrl: "",
        objectFit: "cover",
        width: 0.12,
        height: 0.12,
      }),
  },
  {
    label: "LO Photo",
    icon: <Smile className="h-4 w-4" />,
    create: () =>
      makeElement("image", {
        imageUrl: "",
        objectFit: "cover",
        width: 0.15,
        height: 0.15,
      }),
  },
  {
    label: "Company Logo",
    icon: <Building2 className="h-4 w-4" />,
    create: () =>
      makeElement("image", {
        imageUrl: "",
        objectFit: "contain",
        width: 0.2,
        height: 0.08,
      }),
  },
  {
    label: "Image Upload",
    icon: <Image className="h-4 w-4" />,
    create: () =>
      makeElement("image", {
        imageUrl: "",
        objectFit: "cover",
        width: 0.25,
        height: 0.2,
      }),
  },
];

export function ElementPalette({ editor }: ElementPaletteProps) {
  const handleAdd = useCallback(
    (createFn: () => CanvasElement) => {
      const el = createFn();
      el.zIndex =
        Math.max(0, ...editor.state.elements.map((e) => e.zIndex)) + 1;
      editor.addElement(el);
    },
    [editor]
  );

  const renderSection = (title: string, items: PaletteItem[]) => (
    <div className="space-y-1.5">
      <h4 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            className="h-auto flex-col gap-1 px-2 py-2 text-[11px] font-normal hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10"
            onClick={() => handleAdd(item.create)}
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        <h3 className="text-xs font-semibold text-foreground">Elements</h3>
        {renderSection("Text", TEXT_ITEMS)}
        <Separator />
        {renderSection("Visual Data", VISUAL_ITEMS)}
        <Separator />
        {renderSection("Shapes", SHAPE_ITEMS)}
        <Separator />
        {renderSection("Images", IMAGE_ITEMS)}
      </div>
    </ScrollArea>
  );
}
