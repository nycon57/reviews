/**
 * Trigger Engine — decides when to show the social proof banner.
 * Supports immediate, scroll-based, time-delay, and exit-intent triggers.
 * Event-driven: registers listeners on init, fires callback once trigger fires.
 */

type TriggerType = "immediate" | "scroll" | "time" | "exit_intent";

interface TriggerOptions {
  type: TriggerType;
  value?: number; // scroll % (0-100) or time delay (ms)
}

interface TriggerCleanup {
  destroy: () => void;
}

/**
 * Register a trigger that calls `onTrigger` once the condition is met.
 * Returns a cleanup object to remove listeners.
 */
export function registerTrigger(
  options: TriggerOptions,
  onTrigger: () => void
): TriggerCleanup {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    onTrigger();
  };

  const cleanups: Array<() => void> = [];

  switch (options.type) {
    case "immediate": {
      // Show on next frame to allow DOM setup
      const id = requestAnimationFrame(fire);
      cleanups.push(() => cancelAnimationFrame(id));
      break;
    }

    case "scroll": {
      const threshold = options.value ?? 25; // default 25%
      const handler = () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) {
          fire();
          window.removeEventListener("scroll", handler);
          return;
        }
        const pct = (window.scrollY / scrollHeight) * 100;
        if (pct >= threshold) {
          fire();
          window.removeEventListener("scroll", handler);
        }
      };
      window.addEventListener("scroll", handler, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", handler));
      // Check immediately in case already scrolled
      handler();
      break;
    }

    case "time": {
      const delay = options.value ?? 3000; // default 3 seconds
      const timerId = window.setTimeout(fire, delay);
      cleanups.push(() => clearTimeout(timerId));
      break;
    }

    case "exit_intent": {
      const handler = (e: MouseEvent) => {
        // Only trigger when mouse leaves from the top of the viewport
        if (e.clientY <= 0) {
          fire();
        }
      };
      document.documentElement.addEventListener("mouseleave", handler);
      cleanups.push(() =>
        document.documentElement.removeEventListener("mouseleave", handler)
      );
      break;
    }
  }

  return {
    destroy: () => {
      fired = true;
      cleanups.forEach((fn) => fn());
    },
  };
}
