import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { parseTextFormat } from "@/lib/code";
import { prisma } from "@/lib/db";
import { isUser, json, requireBearerUser } from "../../../_util";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGES_PER_SUBMISSION = 5;

type ImageInput = { name?: string; mime: string; dataBase64: string };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const { taskId } = await params;
  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").trim();
  const textFormat = parseTextFormat(body?.textFormat);
  const images: ImageInput[] = Array.isArray(body?.images) ? body.images : [];

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { submission: true },
  });
  if (!task) return json({ error: "المهمة غير موجودة" }, { status: 404 });
  if (task.ownerId !== user.id) {
    return json({ error: "فقط صاحب المهمة يمكنه إنهاؤها" }, { status: 403 });
  }
  if (task.status !== "running") {
    return json({ error: "المهمة ليست قيد التنفيذ" }, { status: 400 });
  }
  if (task.submission) {
    return json({ error: "تم إرفاق إثبات لهذه المهمة مسبقًا" }, { status: 400 });
  }
  if (!text && images.length === 0) {
    return json({ error: "أرفق نصًا أو صورة كإثبات للعمل" }, { status: 400 });
  }
  if (images.length > MAX_IMAGES_PER_SUBMISSION) {
    return json(
      { error: `الحد الأقصى ${MAX_IMAGES_PER_SUBMISSION} صور لكل إثبات` },
      { status: 400 },
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const saved: { url: string; name: string; kind: "image" }[] = [];
  for (const [i, img] of images.entries()) {
    const ext = ALLOWED_IMAGE_TYPES[img.mime];
    if (!ext) {
      return json(
        { error: "صيغة الصورة غير مدعومة (JPEG / PNG / WebP / GIF)" },
        { status: 400 },
      );
    }
    const buffer = Buffer.from(img.dataBase64, "base64");
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return json({ error: "حجم الصورة أكبر من 15 ميغابايت" }, { status: 400 });
    }
    try {
      const sharp = (await import("sharp")).default;
      // .stats() forces a full pixel decode, catching corrupt/truncated
      // image data that a header-only check would miss.
      await sharp(buffer).stats();
    } catch {
      return json({ error: "الصورة تالفة أو غير صالحة" }, { status: 400 });
    }
    const safeName = `${taskId}-${Date.now()}-${i}.${ext}`;
    await writeFile(path.join(uploadsDir, safeName), buffer);
    saved.push({ url: `/uploads/${safeName}`, name: img.name || safeName, kind: "image" });
  }

  const type = text && saved.length ? "both" : saved.length ? "media" : "text";
  const elapsedMs = Date.now() - task.startedAt.getTime();

  await prisma.$transaction([
    prisma.submission.create({
      data: { taskId, type, text, textFormat, files: { create: saved } },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { status: "review", elapsedMs },
    }),
  ]);

  revalidatePath(`/t/${task.teamId}`);

  return json({
    ok: true,
    elapsedMs,
    task: { id: task.id, status: "review" },
    nextSteps: [
      "تنتظر المهمة الآن تقييم أحد زملائك في الفريق (لا يمكنك تقييم مهمتك)",
      "استخدم create_task لبدء مهمة جديدة",
      "استخدم get_team لعرض حالة الفريق والمتصدرين",
    ],
  });
}
