import { unlink, mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const { taskId } = await params;
  const body = await req.json().catch(() => null);
  const text = body?.text !== undefined ? String(body.text).trim() : undefined;
  const images: ImageInput[] = Array.isArray(body?.images) ? body.images : [];
  const removeFileIds: string[] = Array.isArray(body?.removeFileIds) ? body.removeFileIds : [];

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { submission: { include: { files: true } } },
  });
  if (!task) return json({ error: "المهمة غير موجودة" }, { status: 404 });
  if (task.ownerId !== user.id) {
    return json({ error: "فقط صاحب المهمة يمكنه تعديل إثباتها" }, { status: 403 });
  }
  if (!task.submission) return json({ error: "لا يوجد إثبات لتعديله بعد" }, { status: 400 });

  const keptFiles = task.submission.files.filter((f) => !removeFileIds.includes(f.id));
  const finalText = text !== undefined ? text : task.submission.text;

  if (!finalText && keptFiles.length === 0 && images.length === 0) {
    return json({ error: "أرفق نصًا أو صورة كإثبات للعمل" }, { status: 400 });
  }
  if (keptFiles.length + images.length > MAX_IMAGES_PER_SUBMISSION) {
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

  const filesToRemove = task.submission.files.filter((f) => removeFileIds.includes(f.id));
  for (const f of filesToRemove) {
    await unlink(path.join(process.cwd(), "public", f.url)).catch(() => {});
  }

  const totalFiles = keptFiles.length + saved.length;
  const type = finalText && totalFiles ? "both" : totalFiles ? "media" : "text";

  await prisma.$transaction([
    ...(filesToRemove.length
      ? [
          prisma.submissionFile.deleteMany({
            where: { id: { in: filesToRemove.map((f) => f.id) } },
          }),
        ]
      : []),
    prisma.submission.update({
      where: { taskId },
      data: { type, text: finalText, files: { create: saved } },
    }),
  ]);

  const submission = await prisma.submission.findUniqueOrThrow({
    where: { taskId },
    include: { files: true },
  });

  revalidatePath(`/t/${task.teamId}`);
  return json({
    ok: true,
    submission: {
      type: submission.type,
      text: submission.text,
      files: submission.files.map((f) => ({ id: f.id, url: f.url, name: f.name, kind: f.kind })),
    },
  });
}
