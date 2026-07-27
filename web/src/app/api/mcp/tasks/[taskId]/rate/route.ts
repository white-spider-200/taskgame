import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isUser, json, requireBearerUser } from "../../../_util";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const { taskId } = await params;
  const body = await req.json().catch(() => null);
  const stars = Number(body?.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return json({ error: "اختر عدد النجوم أولًا (1-5)" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return json({ error: "المهمة غير موجودة" }, { status: 404 });
  if (task.status === "running") {
    return json({ error: "المهمة ليست بانتظار التقييم" }, { status: 400 });
  }
  if (task.ownerId === user.id) {
    return json({ error: "لا يمكنك تقييم مهمتك" }, { status: 403 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: task.teamId } },
  });
  if (!membership) return json({ error: "لست عضوًا في هذا الفريق" }, { status: 403 });

  await prisma.rating.upsert({
    where: { taskId_raterId: { taskId, raterId: user.id } },
    create: { taskId, raterId: user.id, stars },
    update: { stars },
  });

  if (task.status === "review") {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "done", completedAt: new Date() },
    });
  }

  const ratings = await prisma.rating.findMany({ where: { taskId } });
  const avgStars = ratings.reduce((a, r) => a + r.stars, 0) / ratings.length;

  revalidatePath(`/t/${task.teamId}`);
  return json({ ok: true, stars: avgStars, count: ratings.length });
}
