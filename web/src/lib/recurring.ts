import { prisma } from "./db";

export type RecurringRule = {
  freq: string;
  weekdays: string;
  monthDay: number;
  hour: number;
  minute: number;
};

export function parseWeekdays(csv: string): number[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    // Guard the empty string explicitly: Number("") is 0, which would silently
    // turn "no days selected" into "every Sunday".
    .filter((s) => s !== "")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    .sort((a, b) => a - b);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function at(base: Date, hour: number, minute: number) {
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
    0,
    0,
  );
}

/**
 * The most recent moment this rule was due at or before `now`, or null if it
 * has never come due (e.g. a weekly rule with no weekdays selected).
 * All arithmetic is in server-local time.
 */
export function lastDueAt(rule: RecurringRule, now: Date): Date | null {
  const hour = Math.min(23, Math.max(0, rule.hour));
  const minute = Math.min(59, Math.max(0, rule.minute));

  if (rule.freq === "daily") {
    const today = at(now, hour, minute);
    if (today <= now) return today;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return at(yesterday, hour, minute);
  }

  if (rule.freq === "weekly") {
    const days = parseWeekdays(rule.weekdays);
    if (days.length === 0) return null;
    // Walk back at most a full week to find the latest selected weekday whose
    // time-of-day has already passed.
    for (let back = 0; back < 8; back++) {
      const d = new Date(now);
      d.setDate(d.getDate() - back);
      if (!days.includes(d.getDay())) continue;
      const due = at(d, hour, minute);
      if (due <= now) return due;
    }
    return null;
  }

  if (rule.freq === "monthly") {
    const wanted = Math.min(31, Math.max(1, rule.monthDay));
    for (let back = 0; back < 2; back++) {
      const year = now.getFullYear();
      const month = now.getMonth() - back;
      const ref = new Date(year, month, 1);
      // A 31st rule fires on the last day of shorter months.
      const day = Math.min(
        wanted,
        daysInMonth(ref.getFullYear(), ref.getMonth()),
      );
      const due = new Date(
        ref.getFullYear(),
        ref.getMonth(),
        day,
        hour,
        minute,
        0,
        0,
      );
      if (due <= now) return due;
    }
    return null;
  }

  return null;
}

/** Next moment this rule will come due after `now`. Null if it never will. */
export function nextDueAt(rule: RecurringRule, now: Date): Date | null {
  const hour = Math.min(23, Math.max(0, rule.hour));
  const minute = Math.min(59, Math.max(0, rule.minute));

  if (rule.freq === "daily") {
    const today = at(now, hour, minute);
    if (today > now) return today;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return at(tomorrow, hour, minute);
  }

  if (rule.freq === "weekly") {
    const days = parseWeekdays(rule.weekdays);
    if (days.length === 0) return null;
    for (let ahead = 0; ahead < 8; ahead++) {
      const d = new Date(now);
      d.setDate(d.getDate() + ahead);
      if (!days.includes(d.getDay())) continue;
      const due = at(d, hour, minute);
      if (due > now) return due;
    }
    return null;
  }

  if (rule.freq === "monthly") {
    const wanted = Math.min(31, Math.max(1, rule.monthDay));
    for (let ahead = 0; ahead < 2; ahead++) {
      const ref = new Date(now.getFullYear(), now.getMonth() + ahead, 1);
      const day = Math.min(
        wanted,
        daysInMonth(ref.getFullYear(), ref.getMonth()),
      );
      const due = new Date(
        ref.getFullYear(),
        ref.getMonth(),
        day,
        hour,
        minute,
        0,
        0,
      );
      if (due > now) return due;
    }
    return null;
  }

  return null;
}

/**
 * Creates the tasks that active rules in this team have come due for since
 * their last run. Called on every team page load — there's no cron, so the
 * board catches up whenever someone opens it.
 *
 * Only ever creates ONE task per rule per call (the latest missed occurrence),
 * so a rule left unrun for a month doesn't flood the board on the next visit.
 */
export async function materializeRecurringTasks(teamId: string) {
  const now = new Date();
  const rules = await prisma.recurringTask.findMany({
    where: { teamId, active: true },
  });
  if (rules.length === 0) return 0;

  let created = 0;
  for (const rule of rules) {
    const due = lastDueAt(rule, now);
    if (!due) continue;
    if (rule.lastRunAt && rule.lastRunAt >= due) continue;

    // Compare-and-swap on lastRunAt: if a concurrent request already claimed
    // this occurrence, its update lands first and ours matches zero rows.
    const claimed = await prisma.recurringTask.updateMany({
      where: { id: rule.id, lastRunAt: rule.lastRunAt },
      data: { lastRunAt: due },
    });
    if (claimed.count === 0) continue;

    await prisma.task.create({
      data: {
        title: rule.title,
        desc: rule.desc,
        category: rule.category,
        status: "running",
        // The timer measures work, not lateness — a task materialized hours
        // after it came due still starts counting from zero. (It also keeps
        // sweepStaleTasks from instantly expiring a missed occurrence.)
        startedAt: now,
        teamId: rule.teamId,
        ownerId: rule.ownerId,
        recurringId: rule.id,
      },
    });
    created++;
  }
  return created;
}
