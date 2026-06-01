export type DemoChapter = {
  id: string;
  platform: string;
  phase: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds (exclusive upper bound for display; last chapter uses video end) */
  end: number;
  /** Short label for the timeline scrubber */
  timelineLabel: string;
  headline: string;
  body: string;
  /** Strategy depth not shown explicitly in the video */
  deeper: string[];
};

/** Timestamps synced to public/Demo2.mp4 */
export const DEMO_CHAPTERS: DemoChapter[] = [
  {
    id: "overview",
    platform: "Social Dash",
    phase: "Overview",
    start: 0,
    end: 5,
    timelineLabel: "0:00 · Overview",
    headline: "One orchestration layer. Every platform.",
    body:
      "Social Dash runs a phased execution pipeline across Reddit, X, Facebook, Bluesky, and Threads — trust-building first, conversion second. Each channel keeps its own playbook while sharing campaign voice, guardrails, and attribution back to intake.",
    deeper: [
      "Four strategic pillars: trust communities, AI content distribution, owned community channels, and UTM-attributed conversion.",
      "Platform rollouts are timed — karma warmup before product positioning, discovery before high-intent engagement.",
      "TikTok, Instagram Reels, and YouTube Shorts extend the same persona-led video strategy; WhatsApp and Telegram capture owned audiences.",
      "Target outcome: scale from hundreds to thousands of monthly intake submissions with qualified lead rates above 60%.",
    ],
  },
  {
    id: "reddit-warmup",
    platform: "Reddit",
    phase: "Karma warmup",
    start: 5,
    end: 11,
    timelineLabel: "0:05 · Reddit comments",
    headline: "Build trust before you sell.",
    body:
      "Reddit is the trust engine. Agents comment in neutral subs — fitness, askdocs, lifestyle — with peer-level tone and no product mentions. The goal is karma, account credibility, and a posting history that survives moderation in sensitive health communities.",
    deeper: [
      "Days 1–7 target 100+ karma per account across three or more subreddits, with 5–8 comments per day.",
      "Multiple accounts can corroborate each other in the same thread during positioning — so recommendations feel organic, not coordinated spam.",
      "Upvoting relevant content alongside comments reinforces natural participation patterns.",
    ],
  },
  {
    id: "reddit-dm",
    platform: "Reddit",
    phase: "Conversion",
    start: 11,
    end: 16,
    timelineLabel: "0:11 · Reddit DM",
    headline: "Close in private when intent is highest.",
    body:
      "After public comments in high-intent threads, agents send DM follow-ups with intake links — moving the conversation off-thread where users expect a personal next step.",
    deeper: [
      "Standard cadence: comment in-thread first, DM 12–24 hours later so the touch feels earned.",
      "Community rules are refreshed before entering each new subreddit to avoid shadow bans.",
      "KPI: DM-to-intake click-through above 10% on qualified threads.",
    ],
  },
  {
    id: "x-discovery",
    platform: "X",
    phase: "Warmup",
    start: 16,
    end: 21,
    timelineLabel: "0:16 · X search",
    headline: "Find conversations while they are still visible.",
    body:
      "X agents run Latest-tab search sweeps on men's health and ED keywords, prioritising posts with fewer replies where a thoughtful comment still gets seen.",
    deeper: [
      "Days 1–10 focus on discovery and light engagement before shifting to educational content.",
      "For You feed sweeps complement keyword search for broader reach.",
      "X Communities extend the playbook into niche men's health and telehealth groups.",
    ],
  },
  {
    id: "x-engage",
    platform: "X",
    phase: "Engage & content",
    start: 21,
    end: 31,
    timelineLabel: "0:21 · X replies & quotes",
    headline: "Reply for rapport. Quote for reach.",
    body:
      "Empathetic replies build peer credibility on individual tweets; quote posts carry educational framing — spray vs tablet, delivery format, clinician-first messaging — without needing a full content calendar.",
    deeper: [
      "Replies and quotes target different posts so no single thread gets overloaded.",
      "Quote tweets outperform plain reposts for commentary-led discovery.",
      "Content phase adds educational threads, infographics, and opinion takes to drive reply volume.",
    ],
  },
  {
    id: "fb-discovery",
    platform: "Facebook",
    phase: "Discovery",
    start: 31,
    end: 40,
    timelineLabel: "0:31 · FB group scan",
    headline: "Groups are where patients talk honestly.",
    body:
      "Facebook agents scan men's health and condition-specific groups, identify posts worth engaging, and draft warm comments or longer educational group posts from the same campaign voice.",
    deeper: [
      "Group engagement is the primary Facebook motion — scan, comment, approve, post.",
      "Reels can repurpose short-form video from the TikTok pipeline when assets are available.",
      "Longer-form page and group posts carry blog-style education plus intake CTAs.",
    ],
  },
  {
    id: "fb-comment",
    platform: "Facebook",
    phase: "Engage",
    start: 40,
    end: 51,
    timelineLabel: "0:40 · FB comment",
    headline: "Validate before you recommend.",
    body:
      "Agents leave peer-style comments where members share treatment experiences — acknowledging what worked for others before gently introducing licensed telehealth or prescription options.",
    deeper: [
      "Warmup-phase comments avoid hard-sell language; positioning comes after credibility is established in the group.",
      "Comments are drafted to match group tone and moderator expectations.",
    ],
  },
  {
    id: "fb-post",
    platform: "Facebook",
    phase: "Content",
    start: 51,
    end: 60,
    timelineLabel: "0:51 · FB group post",
    headline: "Own the narrative with educational posts.",
    body:
      "Group posts normalize the conversation — performance anxiety, consistency, speaking with a clinician — and end with a soft intake CTA that reads as helpful, not promotional.",
    deeper: [
      "Educational framing outperforms product-first posts in health groups.",
      "Posts can include supporting imagery when the campaign provides approved assets.",
      "Some groups require moderator approval; content is written to pass review.",
    ],
  },
  {
    id: "bluesky-discovery",
    platform: "Bluesky",
    phase: "Warmup",
    start: 60,
    end: 67,
    timelineLabel: "1:00 · Bluesky search",
    headline: "Same playbook as X — tech-forward audience.",
    body:
      "Bluesky mirrors the X strategy: search on health keywords, then educational engagement. The feed is smaller but highly engaged on wellness, biohacking, and men's health.",
    deeper: [
      "Two to three distinct account voices: health-curious, biohacker, telehealth advocate.",
      "Positioning frames the offer as a smarter alternative to legacy ED brands — educational, not adversarial.",
      "Engage health and wellness Starter Packs to build early credibility.",
    ],
  },
  {
    id: "threads-discovery",
    platform: "Threads",
    phase: "Warmup",
    start: 67,
    end: 76,
    timelineLabel: "1:07 · Threads search",
    headline: "Mirror X inside the Meta graph.",
    body:
      "Threads runs the same search-and-engage loop as X, with content aligned to Instagram persona pages for clients who treat Meta properties as one audience surface.",
    deeper: [
      "Educational replies mirror X positioning while staying native to Threads tone.",
      "Cross-discovery via Instagram Explore helps surface threads worth engaging.",
      "KPI focus: cross-pollination between short-form video personas and text engagement.",
    ],
  },
  {
    id: "threads-engage",
    platform: "Threads",
    phase: "Engage",
    start: 76,
    end: 83,
    timelineLabel: "1:16 · Threads reply",
    headline: "Educational replies on high-intent threads.",
    body:
      "Reply agents post concise, educational copy where men's health is already being discussed — framing delivery-format innovation without breaking taboo or leading with a hard sell.",
    deeper: [
      "Replies target individual posts where comment volume is still low enough to be seen.",
      "Voice stays consistent with the campaign brief and any linked Instagram persona.",
      "Threads completes the text-first pillar alongside Reddit, X, and Bluesky.",
    ],
  },
];

export const VIDEO_DURATION_S = 83;

export function chapterAtTime(seconds: number): DemoChapter {
  const t = Math.max(0, seconds);
  for (let i = DEMO_CHAPTERS.length - 1; i >= 0; i--) {
    if (t >= DEMO_CHAPTERS[i].start) return DEMO_CHAPTERS[i];
  }
  return DEMO_CHAPTERS[0];
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
