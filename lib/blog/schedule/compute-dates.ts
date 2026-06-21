import type { JsonPost, ScheduleConfig, ScheduledPost } from "./types";

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function publishAtForDate(dateStr: string): string {
  return dateStr;
}

function distributeAcrossWeek(
  posts: JsonPost[],
  weekStartDate: string,
  phase: string,
): ScheduledPost[] {
  if (posts.length === 0) return [];

  return posts.map((post, index) => {
    const dayOffset = Math.floor((index * 7) / posts.length);
    const dateStr = addDays(weekStartDate, dayOffset);
    return {
      ...post,
      computedPublishedAt: publishAtForDate(dateStr),
      phase,
    };
  });
}

/** Build a per-week post count array from a ramp (repeating the last value). */
export function resolveWeeklyCounts(
  totalPosts: number,
  ramp: number[] | undefined,
  fallback: number,
): number[] {
  if (totalPosts === 0) return [];

  const base = ramp?.length ? ramp : [fallback];
  const counts: number[] = [];
  let remaining = totalPosts;
  let weekIndex = 0;

  while (remaining > 0) {
    const cap = base[Math.min(weekIndex, base.length - 1)];
    const take = Math.min(cap, remaining);
    counts.push(take);
    remaining -= take;
    weekIndex++;
  }

  return counts;
}

function distributeInRampingWeeklyBatches(
  posts: JsonPost[],
  startDate: string,
  weeklyCounts: number[],
  phase: string,
): ScheduledPost[] {
  const scheduled: ScheduledPost[] = [];
  let postIndex = 0;

  for (
    let weekIndex = 0;
    weekIndex < weeklyCounts.length && postIndex < posts.length;
    weekIndex++
  ) {
    const weekCount = weeklyCounts[weekIndex];
    const batch = posts.slice(postIndex, postIndex + weekCount);
    const weekStart = addDays(startDate, weekIndex * 7);
    scheduled.push(...distributeAcrossWeek(batch, weekStart, phase));
    postIndex += weekCount;
  }

  return scheduled;
}

export function computeSchedule(
  posts: JsonPost[],
  config: ScheduleConfig,
  runDate = new Date(),
): ScheduledPost[] {
  const explicit = posts.filter((post) => post.publishedAt);
  const auto = posts.filter((post) => !post.publishedAt);

  const pillars = auto.filter((post) => post.tier === 1 || post.isPillar);
  const backfill = auto.filter(
    (post) =>
      !pillars.includes(post) && (post.tier === 2 || post.tier === 3),
  );
  const stagger = auto.filter(
    (post) => post.tier === 4 && !pillars.includes(post),
  );
  const remainder = auto.filter(
    (post) =>
      !pillars.includes(post) &&
      !backfill.includes(post) &&
      !stagger.includes(post),
  );

  const week1Start = config.startDate;
  const backfillStart = addDays(config.startDate, 7);
  const backfillPosts = [...backfill, ...remainder];

  const backfillWeeklyCounts = resolveWeeklyCounts(
    backfillPosts.length,
    config.backfillRampPerWeek,
    config.backfillPerWeek,
  );
  const backfillScheduled = distributeInRampingWeeklyBatches(
    backfillPosts,
    backfillStart,
    backfillWeeklyCounts,
    "weeks-2-plus-backfill",
  );

  const staggerStart = addDays(backfillStart, backfillWeeklyCounts.length * 7);
  const staggerWeeklyCounts = resolveWeeklyCounts(
    stagger.length,
    config.staggerRampPerWeek,
    config.staggerPerWeek,
  );
  const staggerScheduled = distributeInRampingWeeklyBatches(
    stagger,
    staggerStart,
    staggerWeeklyCounts,
    "stagger-long-tail",
  );

  const scheduled: ScheduledPost[] = [
    ...distributeAcrossWeek(pillars, week1Start, "week-1-pillars"),
    ...backfillScheduled,
    ...staggerScheduled,
    ...explicit.map((post) => ({
      ...post,
      computedPublishedAt: post.publishedAt!.slice(0, 10),
      phase: "explicit",
    })),
  ];

  const runDay = runDate.toISOString().slice(0, 10);
  for (const post of scheduled) {
    const publishDay = post.computedPublishedAt.slice(0, 10);
    if (publishDay < runDay && post.phase !== "explicit") {
      throw new Error(
        `Post "${post.slug}" would be backdated to ${post.computedPublishedAt}. ` +
          `Set config.startDate to today or later (run date: ${runDay}).`,
      );
    }
  }

  return scheduled.sort((a, b) =>
    a.computedPublishedAt.localeCompare(b.computedPublishedAt),
  );
}
