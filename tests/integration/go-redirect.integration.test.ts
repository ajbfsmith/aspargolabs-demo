import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/go/route";
import {
  buildAttributionVisitInput,
  resolveDestPath,
  utmSourceForVisit,
} from "@/lib/attribution/go-redirect";
import { hasTrackableUtms } from "@/lib/attribution/inbound-params";

const insertAttributionVisit = vi.fn();

vi.mock("@/lib/attribution/attribution-store", () => ({
  insertAttributionVisit: (...args: unknown[]) => insertAttributionVisit(...args),
}));

describe("go redirect helpers", () => {
  it("resolveDestPath allows internal paths only", () => {
    expect(resolveDestPath(null)).toBe("/");
    expect(resolveDestPath("/blog/foo")).toBe("/blog/foo");
    expect(resolveDestPath("//evil.com")).toBe("/");
    expect(resolveDestPath("https://evil.com")).toBe("/");
  });

  it("utmSourceForVisit falls back to utm_campaign", () => {
    expect(
      utmSourceForVisit({ utm_campaign: "patient-reengage-2026" }),
    ).toBe("patient-reengage-2026");
    expect(utmSourceForVisit({ utm_source: "email" })).toBe("email");
  });

  it("hasTrackableUtms requires utm_source or utm_campaign", () => {
    expect(hasTrackableUtms(new URLSearchParams())).toBe(false);
    expect(hasTrackableUtms(new URLSearchParams("utm_medium=winback"))).toBe(
      false,
    );
    expect(hasTrackableUtms(new URLSearchParams("utm_source=email"))).toBe(
      true,
    );
    expect(
      hasTrackableUtms(new URLSearchParams("utm_campaign=test")),
    ).toBe(true);
  });

  it("buildAttributionVisitInput maps inbound fields", () => {
    const row = buildAttributionVisitInput({
      inbound: {
        utm_source: "email",
        utm_medium: "winback",
        utm_campaign: "patient-reengage-2026",
        utm_content: "email-1",
      },
      dest_path: "/",
      referrer: "https://mail.example/",
      ip: "1.2.3.4",
      user_agent: "test-agent",
      visit_id: "visit-123",
    });
    expect(row.id).toBe("visit-123");
    expect(row.utm_source).toBe("email");
    expect(row.utm_content).toBe("email-1");
    expect(row.dest_path).toBe("/");
    expect(row.referrer).toBe("https://mail.example/");
    expect(row.ip).toBe("1.2.3.4");
    expect(row.user_agent).toBe("test-agent");
  });
});

describe("GET /go", () => {
  beforeEach(() => {
    insertAttributionVisit.mockReset();
    insertAttributionVisit.mockResolvedValue({
      id: "visit-123",
      visited_at: new Date().toISOString(),
    });
  });

  it("returns 400 when UTMs are missing", async () => {
    const res = await GET(
      new Request("https://acceleratehealth.co/go?utm_medium=winback"),
    );
    expect(res.status).toBe(400);
    expect(insertAttributionVisit).not.toHaveBeenCalled();
  });

  it("logs visit and redirects to clean homepage", async () => {
    const res = await GET(
      new Request(
        "https://acceleratehealth.co/go?utm_source=email&utm_campaign=patient-reengage-2026&utm_content=email-1",
        { headers: { "user-agent": "vitest", referer: "https://mail.test/" } },
      ),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://acceleratehealth.co/");
    expect(insertAttributionVisit).toHaveBeenCalledOnce();
    const payload = insertAttributionVisit.mock.calls[0]![0] as {
      utm_source: string;
      utm_campaign: string;
      utm_content: string;
      dest_path: string;
      user_agent: string;
    };
    expect(payload.utm_source).toBe("email");
    expect(payload.utm_campaign).toBe("patient-reengage-2026");
    expect(payload.utm_content).toBe("email-1");
    expect(payload.dest_path).toBe("/");
    expect(payload.user_agent).toBe("vitest");
  });

  it("redirects to dest without UTMs in location", async () => {
    const res = await GET(
      new Request(
        "https://acceleratehealth.co/go?utm_source=email&utm_campaign=test&dest=/blog/foo",
      ),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://acceleratehealth.co/blog/foo",
    );
    const payload = insertAttributionVisit.mock.calls[0]![0] as {
      dest_path: string;
    };
    expect(payload.dest_path).toBe("/blog/foo");
  });
});
