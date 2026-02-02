import { describe, it, expect } from "vitest";
import {
  computeDiff,
  generateChangeSummary,
  formatDiffValue,
} from "../config-diff";

describe("computeDiff", () => {
  it("returns empty array for identical objects", () => {
    const obj = { theme: { colors: { primary: "#fff" } } };
    expect(computeDiff(obj, obj)).toEqual([]);
  });

  it("detects added fields", () => {
    const oldObj = { theme: { colors: {} } };
    const newObj = { theme: { colors: { primary: "#fff" } } };
    const diffs = computeDiff(oldObj, newObj);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      path: "theme.colors.primary",
      type: "added",
      newValue: "#fff",
    });
  });

  it("detects removed fields", () => {
    const oldObj = { theme: { colors: { primary: "#fff" } } };
    const newObj = { theme: { colors: {} } };
    const diffs = computeDiff(oldObj, newObj);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      path: "theme.colors.primary",
      type: "removed",
      oldValue: "#fff",
    });
  });

  it("detects changed values", () => {
    const oldObj = { theme: { colors: { primary: "#000" } } };
    const newObj = { theme: { colors: { primary: "#fff" } } };
    const diffs = computeDiff(oldObj, newObj);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      path: "theme.colors.primary",
      type: "changed",
      oldValue: "#000",
      newValue: "#fff",
    });
  });

  it("handles top-level changes", () => {
    const oldObj = { name: "old" };
    const newObj = { name: "new" };
    const diffs = computeDiff(oldObj, newObj);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe("name");
    expect(diffs[0].type).toBe("changed");
  });

  it("handles nested additions and removals together", () => {
    const oldObj = { content: { showHeader: true, headerText: "Hello" } };
    const newObj = { content: { showHeader: false, showCTA: true } };
    const diffs = computeDiff(oldObj, newObj);
    expect(diffs).toHaveLength(3);
    expect(diffs.find((d) => d.path === "content.showHeader")?.type).toBe("changed");
    expect(diffs.find((d) => d.path === "content.headerText")?.type).toBe("removed");
    expect(diffs.find((d) => d.path === "content.showCTA")?.type).toBe("added");
  });

  it("handles array value changes", () => {
    const oldObj = { sources: ["google"] };
    const newObj = { sources: ["google", "zillow"] };
    const diffs = computeDiff(oldObj, newObj);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe("changed");
  });

  it("treats null and undefined changes correctly", () => {
    const oldObj = { a: null as unknown };
    const newObj = { a: "value" };
    const diffs = computeDiff(oldObj, newObj);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe("changed");
  });
});

describe("generateChangeSummary", () => {
  it("returns 'No changes' for empty diffs", () => {
    expect(generateChangeSummary([])).toBe("No changes");
  });

  it("groups by top-level key", () => {
    const diffs = [
      { path: "theme.colors.primary", type: "changed" as const, oldValue: "#000", newValue: "#fff" },
      { path: "theme.colors.text", type: "changed" as const, oldValue: "#000", newValue: "#111" },
      { path: "content.showHeader", type: "changed" as const, oldValue: true, newValue: false },
    ];
    const summary = generateChangeSummary(diffs);
    expect(summary).toContain("Theme (2)");
    expect(summary).toContain("Content");
    expect(summary).toContain("3 changed");
  });

  it("shows mixed action types", () => {
    const diffs = [
      { path: "theme.colors.primary", type: "added" as const, newValue: "#fff" },
      { path: "content.showHeader", type: "removed" as const, oldValue: true },
    ];
    const summary = generateChangeSummary(diffs);
    expect(summary).toContain("1 added");
    expect(summary).toContain("1 removed");
  });
});

describe("formatDiffValue", () => {
  it("formats null/undefined as dash", () => {
    expect(formatDiffValue(null)).toBe("—");
    expect(formatDiffValue(undefined)).toBe("—");
  });

  it("formats strings with quotes", () => {
    expect(formatDiffValue("hello")).toBe('"hello"');
  });

  it("truncates long strings", () => {
    const long = "a".repeat(100);
    const result = formatDiffValue(long);
    expect(result.length).toBeLessThan(85);
    expect(result).toContain("...");
  });

  it("formats booleans", () => {
    expect(formatDiffValue(true)).toBe("true");
    expect(formatDiffValue(false)).toBe("false");
  });

  it("formats numbers", () => {
    expect(formatDiffValue(42)).toBe("42");
  });

  it("formats arrays", () => {
    expect(formatDiffValue(["a", "b"])).toBe('["a", "b"]');
  });
});
