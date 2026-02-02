"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { css } from "@codemirror/lang-css";
import { defaultKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { AlertTriangle, Info } from "lucide-react";
import { validateCustomCSS } from "@/embed/core/css-sanitizer";

interface CustomCSSEditorProps {
  value: string;
  onChange: (css: string) => void;
  maxLength?: number;
}

const MAX_CSS_LENGTH = 5000;

export function CustomCSSEditor({
  value,
  onChange,
  maxLength = MAX_CSS_LENGTH,
}: CustomCSSEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdate = useCallback(
    (newValue: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setWarnings(validateCustomCSS(newValue));
        onChange(newValue);
      }, 300);
    },
    [onChange],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        keymap.of(defaultKeymap),
        css(),
        syntaxHighlighting(defaultHighlightStyle),
        cmPlaceholder(".rw-review {\n  border-radius: 12px;\n}"),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const doc = update.state.doc.toString();
            handleUpdate(doc);
          }
        }),
        EditorView.theme({
          "&": {
            fontSize: "13px",
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            minHeight: "160px",
            maxHeight: "320px",
            overflow: "auto",
          },
          "&.cm-focused": {
            outline: "none",
            borderColor: "hsl(var(--ring))",
            boxShadow: "0 0 0 2px hsl(var(--ring) / 0.2)",
          },
          ".cm-content": {
            padding: "8px 12px",
          },
          ".cm-gutters": {
            display: "none",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="space-y-2">
      <div ref={containerRef} />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>CSS rules injected inside the widget Shadow DOM</span>
        <span className={isOverLimit ? "text-destructive font-medium" : ""}>
          {charCount.toLocaleString()}/{maxLength.toLocaleString()}
        </span>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5"
            >
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
        <Info size={12} className="mt-0.5 shrink-0" />
        <span>
          Custom CSS applies after the widget&apos;s built-in styles. Use{" "}
          <code className="bg-muted px-1 rounded text-[11px]">.rw-*</code>{" "}
          class selectors to target widget elements.
        </span>
      </div>
    </div>
  );
}
