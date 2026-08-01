import { prisma } from "./db";

export type AdminRatingDTO = {
  raterId: string;
  raterName: string;
  raterInitial: string;
  raterColor: string;
  raterAvatarUrl: string | null;
  stars: number;
};

export type AdminTaskDTO = {
  id: string;
  title: string;
  category: string;
  status: string;
  ownerId: string;
  ownerName: string;
  completedAt: string | null;
  avgStars: number | null;
  ratings: AdminRatingDTO[];
};

export type AdminMemberDTO = {
  id: string;
  name: string;
  initial: string;
  color: string;
  avatarUrl: string | null;
  email: string;
  role: string;
  basePoints: number;
  blocked: boolean;
  tasksCompleted: number;
  avgRatingReceived: number | null;
};

export type AdminPayload = {
  team: { id: string; name: string; inviteCode: string };
  members: AdminMemberDTO[];
  tasks: AdminTaskDTO[];
};

export async function getTeamAdminPayload(
  userId: string,
  teamId: string,
): Promise<AdminPayload | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId, teamId } },
    include: { team: true },
  });
  if (!membership || membership.blocked || membership.role !== "owner") {
    return null;
  }

  const members = await prisma.membership.findMany({
    where: { teamId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { teamId },
    include: {
      owner: true,
      ratings: { include: { rater: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const taskDTOs: AdminTaskDTO[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    status: t.status,
    ownerId: t.ownerId,
    ownerName: t.owner.name,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    avgStars: t.ratings.length
      ? t.ratings.reduce((a, r) => a + r.stars, 0) / t.ratings.length
      : null,
    ratings: t.ratings.map((r) => ({
      raterId: r.raterId,
      raterName: r.rater.name,
      raterInitial: r.rater.initial,
      raterColor: r.rater.color,
      raterAvatarUrl: r.rater.avatarUrl,
      stars: r.stars,
    })),
  }));

  const memberDTOs: AdminMemberDTO[] = members.map((m) => {
    const ownRatings = taskDTOs
      .filter((t) => t.ownerId === m.userId && t.avgStars != null)
      .flatMap((t) => t.ratings.map((r) => r.stars));
    return {
      id: m.userId,
      name: m.user.name,
      initial: m.user.initial,
      color: m.user.color,
      avatarUrl: m.user.avatarUrl,
      email: m.user.email,
      role: m.role,
      basePoints: m.basePoints,
      blocked: m.blocked,
      tasksCompleted: taskDTOs.filter(
        (t) => t.ownerId === m.userId && t.status === "done",
      ).length,
      avgRatingReceived: ownRatings.length
        ? ownRatings.reduce((a, s) => a + s, 0) / ownRatings.length
        : null,
    };
  });

  return {
    team: {
      id: membership.team.id,
      name: membership.team.name,
      inviteCode: membership.team.inviteCode,
    },
    members: memberDTOs,
    tasks: taskDTOs,
  };
}
