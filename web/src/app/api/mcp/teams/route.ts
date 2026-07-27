import { prisma } from "@/lib/db";
import { isUser, json, requireBearerUser } from "../_util";

export async function GET(req: Request) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { team: true },
    orderBy: { createdAt: "asc" },
  });

  return json({
    teams: memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      inviteCode: m.team.inviteCode,
      role: m.role,
    })),
  });
}
