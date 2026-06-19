import type { JsonPost, ScheduleConfig, ScheduledPost } from "./types";
import { zonedDateTimeToUtcIso } from "./timezone";

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function publishAtForDate(
  dateStr: string,
  config: ScheduleConfig,
): string {
  return zonedDateTimeToUtcIso(dateStr, config.publishTime, config.timezone);
}

function distributeAcrossWeek(
  posts: JsonPost[],
  weekStartDate: string,
  config: ScheduleConfig,
  phase: string,
): ScheduledPost[] {
  if (posts.length === 0) return [];

  return posts.map((post, index) => {
    const dayOffset = Math.floor((index * 7) / posts.length);
    const dateStr = addDays(weekStartDate, dayOffset);
    return {
      ...post,
      computedPublishedAt: publishAtForDate(dateStr, config),
      phase,
    };
  });
}

function distributeInWeeklyBatches(
  posts: JsonPost[],
  startDate: string,
  perWeek: number,
  config: ScheduleConfig,
  phase: string,
): ScheduledPost[] {
  const scheduled: ScheduledPost[] = [];

  for (let index = 0; index < posts.length; index++) {
    const weekIndex = Math.floor(index / perWeek);
    const indexInWeek = index % perWeek;
    const daysInWeek = Math.min(7, perWeek);
    const dayOffset = Math.floor((indexInWeek * 7) / daysInWeek);
    const dateStr = addDays(startDate, weekIndex * 7 + dayOffset);

    scheduled.push({
      ...posts[index],
      computedPublishedAt: publishAtForDate(dateStr, config),
      phase,
    });
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
  const stagger = auto.filter((post) => post.tier === 4);
  const remainder = auto.filter(
    (post) =>
      !pillars.includes(post) &&
      !backfill.includes(post) &&
      !stagger.includes(post),
  );

  const week1Start = config.startDate;
  const backfillStart = addDays(config.startDate, 7);
  const staggerStart = addDays(config.startDate, 7 * 6);

  const scheduled: ScheduledPost[] = [
    ...distributeAcrossWeek(pillars, week1Start, config, "week-1-pillars"),
    ...distributeInWeeklyBatches(
      [...backfill, ...remainder],
      backfillStart,
      config.backfillPerWeek,
      config,
      "weeks-2-6-backfill",
    ),
    ...distributeInWeeklyBatches(
      stagger,
      staggerStart,
      config.staggerPerWeek,
      config,
      "months-2-7-stagger",
    ),
    ...explicit.map((post) => ({
      ...post,
      computedPublishedAt: post.publishedAt!,
      phase: "explicit",
    })),
  ];

  const runIso = runDate.toISOString();
  for (const post of scheduled) {
    if (post.computedPublishedAt < runIso && post.phase !== "explicit") {
      throw new Error(
        `Post "${post.slug}" would be backdated to ${post.computedPublishedAt}. ` +
          `Set config.startDate to today or later (run date: ${runIso.slice(0, 10)}).`,
      );
    }
  }

  return scheduled.sort((a, b) =>
    a.computedPublishedAt.localeCompare(b.computedPublishedAt),
  );
}
