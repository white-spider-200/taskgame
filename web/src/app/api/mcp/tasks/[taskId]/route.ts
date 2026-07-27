import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isUser, json, requireBearerUser } from "../../_util";

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
