import { prisma } from "./db";

export type TeamMember = {
  id: string;
  name: string;
  initial: string;
  color: string;
  basePoints: number;
};

export type SubmissionDTO = {
  type: "text" | "image" | "video" | "both";
  text: string;
  fileUrl: string | null;
};

export type TaskDTO = {
  id: string;
  title: string;
  desc: string;
  category: string;
  status: "running" | "review" | "done";
  startedAt: string;
  elapsedMs: number | null;
  ownerId: string;
  stars: number | null;
  ratingsCount: number;
  myRating: number | null;
  submission: SubmissionDTO | null;
};

export type TeamPayload = {
  team: { id: string; name: string; inviteCode: string };
  me: TeamMember & { email: string };
  members: TeamMember[];
  tasks: TaskDTO[];
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

export async function getTeamPayload(
  userId: string,
  teamId?: string,
): Promise<TeamPayload | null> {
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

  if (!membership) return null;

  const members = await prisma.membership.findMany({
    where: { teamId: membership.teamId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { teamId: membership.teamId },
    include: {
      ratings: { include: { rater: true } },
      owner: true,
      submission: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const memberDTOs: TeamMember[] = members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    initial: m.user.initial,
    color: m.user.color,
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
    ownerId: t.ownerId,
    stars: t.ratings.length
      ? t.ratings.reduce((a, r) => a + r.stars, 0) / t.ratings.length
      : null,
    ratingsCount: t.ratings.length,
    myRating: t.ratings.find((r) => r.raterId === userId)?.stars ?? null,
    submission: t.submission
      ? {
          type: t.submission.type as SubmissionDTO["type"],
          text: t.submission.text,
          fileUrl: t.submission.fileUrl,
        }
      : null,
  }));

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
      basePoints: membership.basePoints,
    },
    members: memberDTOs,
    tasks: taskDTOs,
  };
}
