import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasFuzzyClickMatchCriteria,
  resolveExplicitClickIdFromWebhook,
  resolveClickIdFromWebhook,
} from "@/lib/attribution/click-resolution";

const getLinkClick = vi.fn();
const findRecentUnlinkedClick = vi.fn();

vi.mock("@/lib/attribution/attribution-store", () => ({
  getLinkClick: (...args: unknown[]) => getLinkClick(...args),
  findRecentUnlinkedClick: (...args: unknown[]) => findRecentUnlinkedClick(...args),
}));

const CLICK_ID = "ea1cf62a-663b-4574-9f77-781c7f963264";

describe("click resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLinkClick.mockResolvedValue({
      id: CLICK_ID,
      utm_campaign: "bf-hezkue-landing",
    });
    findRecentUnlinkedClick.mockResolvedValue("recent-click-id");
  });

  it("hasFuzzyClickMatchCriteria requires real UTM signals", () => {
    expect(hasFuzzyClickMatchCriteria({}, null)).toBe(false);
    expect(
      hasFuzzyClickMatchCriteria({ utm_campaign: "bf-hezkue-landing" }, null),
    ).toBe(true);
    expect(
      hasFuzzyClickMatchCriteria(
        { utm_source: "AFFILIATE", utm_medium: "landing" },
        null,
      ),
    ).toBe(true);
    expect(
      hasFuzzyClickMatchCriteria({ utm_content: "blog:foo" }, null),
    ).toBe(true);
  });

  it("resolveExplicitClickIdFromWebhook matches click UUID in utm_content", async () => {
    const clickId = await resolveExplicitClickIdFromWebhook({
      utm_content: CLICK_ID,
    });
    expect(clickId).toBe(CLICK_ID);
    expect(findRecentUnlinkedClick).not.toHaveBeenCalled();
  });

  it("resolveClickIdFromWebhook does not fuzzy-match with empty UTMs", async () => {
    const clickId = await resolveClickIdFromWebhook({}, { campaign_id: null, utms: {} });
    expect(clickId).toBeNull();
    expect(findRecentUnlinkedClick).not.toHaveBeenCalled();
  });

  it("resolveClickIdFromWebhook fuzzy-matches when UTMs are present", async () => {
    const clickId = await resolveClickIdFromWebhook(
      {},
      {
        campaign_id: null,
        utms: { utm_campaign: "bf-hezkue-landing", utm_medium: "landing" },
      },
    );
    expect(clickId).toBe("recent-click-id");
    expect(findRecentUnlinkedClick).toHaveBeenCalledWith({
      campaign_id: null,
      utm_source: undefined,
      utm_medium: "landing",
      utm_campaign: "bf-hezkue-landing",
      utm_content: undefined,
    });
  });
});
