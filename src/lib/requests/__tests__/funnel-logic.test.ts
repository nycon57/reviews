import { describe, expect, it } from "vitest";
import {
  computeAttention,
  furthestStageIndex,
  FUNNEL_STAGES,
} from "../funnel-logic";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-07T00:00:00.000Z").getTime();

function daysAgo(n: number): string {
  return new Date(NOW - n * DAY).toISOString();
}

describe("computeAttention", () => {
  it("flags held when a held reason is present, over everything else", () => {
    expect(
      computeAttention(
        {
          status: "sent",
          sentAt: daysAgo(30),
          openedAt: null,
          completedAt: null,
          heldReason: "unattributed",
        },
        NOW
      )
    ).toBe("held");
  });

  it("flags stuck when sent >14d ago and never opened", () => {
    expect(
      computeAttention(
        {
          status: "sent",
          sentAt: daysAgo(20),
          openedAt: null,
          completedAt: null,
          heldReason: null,
        },
        NOW
      )
    ).toBe("stuck");
  });

  it("is not stuck within the 14-day window", () => {
    expect(
      computeAttention(
        {
          status: "sent",
          sentAt: daysAgo(10),
          openedAt: null,
          completedAt: null,
          heldReason: null,
        },
        NOW
      )
    ).toBeNull();
  });

  it("is not stuck once opened, even if old", () => {
    expect(
      computeAttention(
        {
          status: "opened",
          sentAt: daysAgo(40),
          openedAt: daysAgo(39),
          completedAt: null,
          heldReason: null,
        },
        NOW
      )
    ).toBeNull();
  });

  it("is not stuck for terminal statuses", () => {
    expect(
      computeAttention(
        {
          status: "expired",
          sentAt: daysAgo(40),
          openedAt: null,
          completedAt: null,
          heldReason: null,
        },
        NOW
      )
    ).toBeNull();
  });
});

describe("furthestStageIndex", () => {
  const idx = (stage: string) => FUNNEL_STAGES.indexOf(stage as never);

  it("returns -1 for a never-sent request", () => {
    expect(
      furthestStageIndex({
        type: "survey",
        status: "pending",
        sentAt: null,
        openedAt: null,
        completedAt: null,
        published: false,
      })
    ).toBe(-1);
  });

  it("stops at opened for a sent+opened survey", () => {
    expect(
      furthestStageIndex({
        type: "survey",
        status: "opened",
        sentAt: "t",
        openedAt: "t",
        completedAt: null,
        published: false,
      })
    ).toBe(idx("opened"));
  });

  it("treats a completed survey as reaching submitted (started coincides)", () => {
    expect(
      furthestStageIndex({
        type: "survey",
        status: "completed",
        sentAt: "t",
        openedAt: "t",
        completedAt: "t",
        published: false,
      })
    ).toBe(idx("submitted"));
  });

  it("counts a recording video as started before submission", () => {
    expect(
      furthestStageIndex({
        type: "video",
        status: "recording",
        sentAt: "t",
        openedAt: "t",
        completedAt: null,
        published: false,
      })
    ).toBe(idx("started"));
  });

  it("reaches published when the linked review is live", () => {
    expect(
      furthestStageIndex({
        type: "survey",
        status: "completed",
        sentAt: "t",
        openedAt: "t",
        completedAt: "t",
        published: true,
      })
    ).toBe(idx("published"));
  });
});
