import type { SubmissionTextFormat } from "./code";
import { prisma } from "./db";
import { materializeRecurringTasks, nextDueAt, parseWeekdays } from "./recurring";

export type TeamMember = {
  id: string;
  name: string;
  initial: string;
  color: string;
  avatarUrl: string | null;
  basePoints: number;
};

export type SubmissionFileDTO = {
  id: string;
  url: string;
  name: string;
  kind: "image" | "video" | "spreadsheet" | "doc";
};

export type SubmissionDTO = {
  type: "text" | "image" | "video" | "both" | "media";
  text: string;
  textFormat: SubmissionTextFormat;
  files: SubmissionFileDTO[];
};

export type TaskDTO = {
  id: string;
  title: string;
  desc: string;
  category: string;
  status: "running" | "review" | "done" | "expired";
  startedAt: string;
  elapsedMs: number | null;
  completedAt: string | null;
  ownerId: string;
  stars: number | null;
  ratingsCount: number;
  myRating: number | null;
  recurringId: string | null;
  submission: SubmissionDTO | null;
};

export type RecurringDTO = {
  id: string;
  title: string;
  desc: string;
  category: string;
  freq: "daily" | "weekly" | "monthly";
  weekdays: number[];
  monthDay: number;
  hour: number;
  minute: number;
  active: boolean;
  nextDueAt: string | null;
};

export type TeamPayload = {
  team: { id: string; name: string; inviteCode: string };
  me: TeamMember & { email: string; isOwner: boolean };
  members: TeamMember[];
  tasks: TaskDTO[];
  recurring: RecurringDTO[];
};

function pointsForMember(
  member: TeamMember,
  tasks: TaskDTO[],
) {
  let pts = member.basePoints;
  for (const t of tasks) {
    if (t.ownerId === member.id && t.status === "done" && t.stars) {
      pts += Math.round(t.stars * 2);
    }
  }
  return pts;
}

export { pointsForMember };

// Tasks still running/in-review when their start day ends are stale — the board
// resets daily, so they're archived as "expired" rather than lingering forever.
async function sweepStaleTasks() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  await prisma.task.updateMany({
    where: {
      status: { in: ["running", "review"] },
      startedAt: { lt: startOfToday },
    },
    data: { status: "expired" },
  });
}

export async function getTeamPayload(
  userId: string,
  teamId?: string,
): Promise<TeamPayload | null> {
  await sweepStaleTasks();

  const membership = teamId
    ? await prisma.membership.findUnique({
        where: { userId_teamId: { userId, teamId } },
        include: { team: true, user: true },
      })
    : await prisma.membership.findFirst({
        where: { userId },
        include: { team: true, user: true },
        orderBy: { createdAt: "asc" },
      });

  if (!membership || membership.blocked) return null;

  // No cron: recurring rules catch up whenever someone opens the board.
  await materializeRecurringTasks(membership.teamId);

  const members = await prisma.membership.findMany({
    where: { teamId: membership.teamId, blocked: false },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { teamId: membership.teamId },
    include: {
      ratings: { include: { rater: true } },
      owner: true,
      submission: { include: { files: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Rules are personal — you only manage the ones you created.
  const recurringRules = await prisma.recurringTask.findMany({
    where: { teamId: membership.teamId, ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  const memberDTOs: TeamMember[] = members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    initial: m.user.initial,
    color: m.user.color,
    avatarUrl: m.user.avatarUrl,
    basePoints: m.basePoints,
  }));

  const taskDTOs: TaskDTO[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    desc: t.desc,
    category: t.category,
    status: t.status as TaskDTO["status"],
    startedAt: t.startedAt.toISOString(),
    elapsedMs: t.elapsedMs,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    ownerId: t.ownerId,
    stars: t.ratings.length
      ? t.ratings.reduce((a, r) => a + r.stars, 0) / t.ratings.length
      : null,
    ratingsCount: t.ratings.length,
    myRating: t.ratings.find((r) => r.raterId === userId)?.stars ?? null,
    recurringId: t.recurringId,
    submission: t.submission
      ? {
          type: t.submission.type as SubmissionDTO["type"],
          text: t.submission.text,
          textFormat: t.submission.textFormat as SubmissionTextFormat,
          files: t.submission.files.map((f) => ({
            id: f.id,
            url: f.url,
            name: f.name,
            kind: f.kind as "image" | "video" | "spreadsheet" | "doc",
          })),
        }
      : null,
  }));

  const now = new Date();
  const recurringDTOs: RecurringDTO[] = recurringRules.map((r) => {
    const next = r.active ? nextDueAt(r, now) : null;
    return {
      id: r.id,
      title: r.title,
      desc: r.desc,
      category: r.category,
      freq: r.freq as RecurringDTO["freq"],
      weekdays: parseWeekdays(r.weekdays),
      monthDay: r.monthDay,
      hour: r.hour,
      minute: r.minute,
      active: r.active,
      nextDueAt: next ? next.toISOString() : null,
    };
  });

  return {
    team: {
      id: membership.team.id,
      name: membership.team.name,
      inviteCode: membership.team.inviteCode,
    },
    me: {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      initial: membership.user.initial,
      color: membership.user.color,
      avatarUrl: membership.user.avatarUrl,
      basePoints: membership.basePoints,
      isOwner: membership.role === "owner",
    },
    members: memberDTOs,
    tasks: taskDTOs,
    recurring: recurringDTOs,
  };
}
