"use client";

import { useEffect } from "react";

type MaybeModelContext = {
  registerTool?: unknown;
  provideContext?: unknown;
};

type ModelContextHost = {
  modelContext?: MaybeModelContext;
};

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type WindowWithIdle = typeof globalThis & {
  requestIdleCallback?: (
    callback: (deadline: IdleDeadlineLike) => void,
    options?: { timeout?: number }
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function hasSupportedModelContext(): boolean {
  const navigatorContext = (globalThis.navigator as unknown as ModelContextHost)
    ?.modelContext;
  const documentContext = (globalThis.document as unknown as ModelContextHost)
    ?.modelContext;
  const modelContext = navigatorContext ?? documentContext;

  return Boolean(
    modelContext &&
      (typeof modelContext.registerTool === "function" ||
        typeof modelContext.provideContext === "function")
  );
}

export function WebMcpClientRegistration() {
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const register = () => {
      if (cancelled || !hasSupportedModelContext()) return;
      void import("./registration-client")
        .then(({ registerRepWellWebMcpTools }) => {
          if (!cancelled) {
            void registerRepWellWebMcpTools({ signal: controller.signal });
          }
        })
        .catch(() => {
          // WebMCP is optional and draft-only; absence or load errors are silent.
        });
    };

    const windowWithIdle = globalThis as WindowWithIdle;

    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof globalThis.setTimeout> | null = null;

    if (typeof windowWithIdle.requestIdleCallback === "function") {
      idleHandle = windowWithIdle.requestIdleCallback(register, { timeout: 1500 });
    } else {
      timeoutHandle = globalThis.setTimeout(register, 0);
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (
        idleHandle !== null &&
        typeof windowWithIdle.cancelIdleCallback === "function"
      ) {
        windowWithIdle.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        globalThis.clearTimeout(timeoutHandle);
      }
    };
  }, []);

  return null;
}
