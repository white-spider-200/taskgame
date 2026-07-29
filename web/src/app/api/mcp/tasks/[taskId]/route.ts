import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/format";
import { isUser, json, requireBearerUser } from "../../_util";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const { taskId } = await params;
  const body = await req.json().catch(() => null);

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return json({ error: "المهمة غير موجودة" }, { status: 404 });
  if (task.ownerId !== user.id) {
    return json({ error: "فقط صاحب المهمة يمكنه تعديلها" }, { status: 403 });
  }
  if (task.status !== "running") {
    return json({ error: "لا يمكن تعديل مهمة بعد إنهائها" }, { status: 400 });
  }

  const data: { title?: string; desc?: string; category?: string } = {};

  if (body?.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return json({ error: "اكتب عنوان المهمة أولًا" }, { status: 400 });
    data.title = title;
  }
  if (body?.desc !== undefined) {
    data.desc = String(body.desc).trim();
  }
  if (body?.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      return json({ error: "تصنيف غير صالح" }, { status: 400 });
    }
    data.category = body.category;
  }
  if (Object.keys(data).length === 0) {
    return json({ error: "لا يوجد تعديل لحفظه" }, { status: 400 });
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data });
  revalidatePath(`/t/${task.teamId}`);
  return json({
    ok: true,
    task: { id: updated.id, title: updated.title, desc: updated.desc, category: updated.category },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const { taskId } = await params;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return json({ error: "المهمة غير موجودة" }, { status: 404 });
  if (task.ownerId !== user.id) {
    return json({ error: "فقط صاحب المهمة يمكنه حذفها" }, { status: 403 });
  }
  if (task.status !== "running") {
    return json({ error: "لا يمكن حذف مهمة بعد إنهائها" }, { status: 400 });
  }

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/t/${task.teamId}`);
  return json({ ok: true });
}
