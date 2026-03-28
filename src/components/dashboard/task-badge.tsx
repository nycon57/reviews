"use client";

import { useEffect, useState } from "react";
import { getPendingTaskCount } from "@/lib/tasks";

export function TaskBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    getPendingTaskCount()
      .then((c) => {
        if (!cancelled) setCount(c);
      })
      .catch(() => {
        // Badge stays hidden on error — acceptable degradation
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="rounded-full bg-repwell-teal-300/15 px-1.5 py-0.5 text-[10px] font-bold text-repwell-teal-300 tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  );
}
