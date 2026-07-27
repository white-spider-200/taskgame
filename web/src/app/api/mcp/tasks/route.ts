import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/format";
import { isUser, json, requireBearerUser } from "../_util";

export async function POST(req: Request) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const body = await req.json().catch(() => null);
  const teamId = String(body?.teamId || "").trim();
  const title = String(body?.title || "").trim();
  const desc = String(body?.desc || "").trim();
  const category = String(body?.category || "").trim();

  if (!teamId) return json({ error: "حدد الفريق" }, { status: 400 });
  if (!title) return json({ error: "اكتب عنوان المهمة أولًا" }, { status: 400 });
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return json(
      { error: `تصنيف غير صالح، الخيارات: ${CATEGORIES.join("، ")}` },
      { status: 400 },
    );
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!membership) return json({ error: "لست عضوًا في هذا الفريق" }, { status: 403 });

  const task = await prisma.task.create({
    data: {
      title,
      desc,
      category,
      status: "running",
      startedAt: new Date(),
      teamId,
      ownerId: user.id,
    },
  });

  revalidatePath(`/t/${teamId}`);
  return json({ ok: true, task: { id: task.id, title: task.title, status: task.status } });
}
