// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addHookListener,
  removeHookListener,
  emitHookEvent,
  clearHookListeners,
} from "../core/hooks";

describe("hooks API", () => {
  beforeEach(() => {
    clearHookListeners("test-widget");
    clearHookListeners("other-widget");
  });

  it("calls registered listener on emit", () => {
    const cb = vi.fn();
    addHookListener("test-widget", "ready", cb);
    emitHookEvent("test-widget", "ready", { widgetType: "lo_review" });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ widgetId: "test-widget", event: "ready", widgetType: "lo_review" }),
    );
  });

  it("does not call listener for different event", () => {
    const cb = vi.fn();
    addHookListener("test-widget", "ready", cb);
    emitHookEvent("test-widget", "error", { error: "fail" });
    expect(cb).not.toHaveBeenCalled();
  });

  it("does not call listener for different widget", () => {
    const cb = vi.fn();
    addHookListener("test-widget", "ready", cb);
    emitHookEvent("other-widget", "ready", {});
    expect(cb).not.toHaveBeenCalled();
  });

  it("supports multiple listeners for same event", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    addHookListener("test-widget", "ready", cb1);
    addHookListener("test-widget", "ready", cb2);
    emitHookEvent("test-widget", "ready", {});
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it("removes listener with removeHookListener", () => {
    const cb = vi.fn();
    addHookListener("test-widget", "ready", cb);
    removeHookListener("test-widget", "ready", cb);
    emitHookEvent("test-widget", "ready", {});
    expect(cb).not.toHaveBeenCalled();
  });

  it("clearHookListeners removes all listeners for a widget", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    addHookListener("test-widget", "ready", cb1);
    addHookListener("test-widget", "error", cb2);
    clearHookListeners("test-widget");
    emitHookEvent("test-widget", "ready", {});
    emitHookEvent("test-widget", "error", { error: "oops" });
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });

  it("catches errors in callbacks without stopping other listeners", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cb1 = vi.fn(() => { throw new Error("oops"); });
    const cb2 = vi.fn();
    addHookListener("test-widget", "ready", cb1);
    addHookListener("test-widget", "ready", cb2);
    emitHookEvent("test-widget", "ready", {});
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});
