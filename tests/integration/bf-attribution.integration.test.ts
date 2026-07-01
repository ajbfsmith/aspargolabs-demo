import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasBfHezkueAttributionInParams,
  isBfHezkueCampaignId,
  isBfHezkueUtmCampaign,
} from "@/lib/attribution/bf-attribution";

const insertWebhookEvent = vi.fn();
const isBfHezkueAttributedWebhook = vi.fn();
const upsertJourney = vi.fn();
const upsertPatient = vi.fn();
const markWebhookProcessed = vi.fn();
const appendJourneyEvent = vi.fn();
const getJourneyBySession = vi.fn();

vi.mock("@/lib/attribution/attribution-store", () => ({
  insertWebhookEvent: (...args: unknown[]) => insertWebhookEvent(...args),
  appendJourneyEvent: (...args: unknown[]) => appendJourneyEvent(...args),
  incrementPatientConversionCount: vi.fn(),
  linkClickToJourney: vi.fn(),
  getLinkClick: vi.fn().mockResolvedValue(null),
  findRecentUnlinkedClick: vi.fn().mockResolvedValue(null),
  getJourneyBySession: (...args: unknown[]) => getJourneyBySession(...args),
  getLatestJourneyForPatient: vi.fn(),
  markWebhookProcessed: (...args: unknown[]) => markWebhookProcessed(...args),
  resolveCampaignId: vi.fn().mockResolvedValue(null),
  upsertJourney: (...args: unknown[]) => upsertJourney(...args),
  upsertPatient: (...args: unknown[]) => upsertPatient(...args),
}));

vi.mock("@/lib/attribution/bf-attribution", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/attribution/bf-attribution")>();
  return {
    ...actual,
    isBfHezkueAttributedWebhook: (...args: unknown[]) =>
      isBfHezkueAttributedWebhook(...args),
  };
});

import { processBaskWebhookBody } from "@/lib/attribution/bask-processor";

describe("bf-hezkue attribution helpers", () => {
  it("matches bf-hezkue and bf-hezkue-* slugs", () => {
    expect(isBfHezkueUtmCampaign("bf-hezkue-landing")).toBe(true);
    expect(isBfHezkueUtmCampaign("bf-hezkue-meme")).toBe(true);
    expect(isBfHezkueUtmCampaign("bf-hezkue")).toBe(true);
    expect(isBfHezkueUtmCampaign("patient-reengage-2026")).toBe(false);
    expect(isBfHezkueUtmCampaign(null)).toBe(false);
  });

  it("matches known BF campaign UUIDs", () => {
    expect(isBfHezkueCampaignId("fed96c9a-97ce-4d43-a556-30d3d45f1212")).toBe(true);
    expect(isBfHezkueCampaignId("00000000-0000-0000-0000-000000000000")).toBe(false);
  });

  it("detects bf-hezkue in webhook params", () => {
    expect(
      hasBfHezkueAttributionInParams(
        {},
        { utm_campaign: "bf-hezkue-gymbro" },
      ),
    ).toBe(true);
    expect(
      hasBfHezkueAttributionInParams(
        { campaign_id: "7aae963c-f4df-4925-93f2-4cea2a12965c" },
        {},
      ),
    ).toBe(true);
    expect(
      hasBfHezkueAttributionInParams(
        {},
        { utm_campaign: "patient-reengage-2026" },
      ),
    ).toBe(false);
  });
});

describe("Bask webhook BF filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getJourneyBySession.mockResolvedValue(null);
    upsertJourney.mockResolvedValue({
      id: "journey-1",
      click_id: null,
      is_first_time_order: 1,
      conversion_credited: 0,
      funnel_stage: "patient_created",
    });
    insertWebhookEvent.mockResolvedValue(true);
    markWebhookProcessed.mockResolvedValue(undefined);
    appendJourneyEvent.mockResolvedValue(undefined);
    upsertPatient.mockResolvedValue(undefined);
  });

  it("ignores non-bf webhooks before insert", async () => {
    isBfHezkueAttributedWebhook.mockResolvedValue(false);

    const result = await processBaskWebhookBody({
      type: "newPatient",
      data: {
        sessionId: "sess-1",
        patientId: "pat-1",
        signUpSearchParams: { utm_campaign: "organic" },
      },
    });

    expect(result).toMatchObject({
      status: "ignored",
      reason: "not_bf_hezkue",
    });
    expect(insertWebhookEvent).not.toHaveBeenCalled();
  });

  it("stores bf-hezkue webhooks", async () => {
    isBfHezkueAttributedWebhook.mockResolvedValue(true);

    const result = await processBaskWebhookBody({
      type: "newPatient",
      data: {
        sessionId: "sess-bf",
        patientId: "pat-bf",
        signUpSearchParams: { utm_campaign: "bf-hezkue-landing" },
      },
    });

    expect(insertWebhookEvent).toHaveBeenCalled();
    expect(upsertPatient).toHaveBeenCalled();
    expect(result.status).toBe("ok");
  });
});
