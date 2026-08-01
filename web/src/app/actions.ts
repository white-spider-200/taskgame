"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import {
  createPasswordResetToken,
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  resetPasswordWithToken,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseTextFormat } from "@/lib/code";
import { CATEGORIES, USER_COLORS, initialFromName } from "@/lib/format";
import { getTeamPayload, type SubmissionDTO } from "@/lib/team";

function toSubmissionDTO(submission: {
  type: string;
  text: string;
  textFormat: string;
  files: { id: string; url: string; name: string; kind: string }[];
}): SubmissionDTO {
  return {
    type: submission.type as SubmissionDTO["type"],
    text: submission.text,
    textFormat: parseTextFormat(submission.textFormat),
    files: submission.files.map((f) => ({
      id: f.id,
      url: f.url,
      name: f.name,
      kind: f.kind as "image" | "video" | "spreadsheet",
    })),
  };
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const ALLOWED_SPREADSHEET_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "text/csv": "csv",
};
// Windows/some browsers mislabel .xlsx/.xls as a generic binary MIME type,
// so fall back to the filename extension for spreadsheet uploads.
const SPREADSHEET_EXTENSIONS: Record<string, string> = {
  xlsx: "xlsx",
  xls: "xls",
  csv: "csv",
};
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_SPREADSHEET_BYTES = 15 * 1024 * 1024;
const MAX_IMAGES_PER_SUBMISSION = 5;
const MAX_VIDEOS_PER_SUBMISSION = 3;
const MAX_SPREADSHEETS_PER_SUBMISSION = 3;

type SavedFile = { url: string; name: string; kind: "image" | "video" | "spreadsheet" };

function isSpreadsheetFile(file: File): boolean {
  if (ALLOWED_SPREADSHEET_TYPES[file.type]) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (file.type === "" || file.type === "application/octet-stream") && !!SPREADSHEET_EXTENSIONS[ext];
}

async function validateAndSaveFiles(
  files: File[],
  taskId: string,
): Promise<{ error: string } | { saved: SavedFile[] }> {
  const saved: SavedFile[] = [];
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  for (const file of files) {
    const mime = file.type;
    const imageExt = ALLOWED_IMAGE_TYPES[mime];
    const videoExt = ALLOWED_VIDEO_TYPES[mime];
    const spreadsheetExt =
      ALLOWED_SPREADSHEET_TYPES[mime] ??
      (isSpreadsheetFile(file)
        ? SPREADSHEET_EXTENSIONS[file.name.split(".").pop()!.toLowerCase()]
        : undefined);
    if (!imageExt && !videoExt && !spreadsheetExt) {
      return {
        error:
          "صيغة الملف غير مدعومة (JPEG / PNG / WebP / GIF / MP4 / WebM / MOV / XLSX / XLS / CSV)",
      };
    }
    const kind: "image" | "video" | "spreadsheet" = imageExt
      ? "image"
      : videoExt
        ? "video"
        : "spreadsheet";
    const ext = imageExt ?? videoExt ?? spreadsheetExt!;
    const maxBytes =
      kind === "video" ? MAX_VIDEO_BYTES : kind === "spreadsheet" ? MAX_SPREADSHEET_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return {
        error:
          kind === "video"
            ? "حجم الفيديو أكبر من 50 ميغابايت"
            : kind === "spreadsheet"
              ? "حجم ملف الإكسل أكبر من 15 ميغابايت"
              : "حجم الصورة أكبر من 15 ميغابايت",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (kind === "image") {
      const sharp = (await import("sharp")).default;
      try {
        // .stats() forces a full pixel decode, catching corrupt/truncated
        // image data that .metadata() (header-only) would miss.
        await sharp(buffer).stats();
      } catch {
        return { error: "الصورة تالفة أو غير صالحة، جرّب رفع صورة أخرى" };
      }
    }
    const safeName = `${taskId}-${Date.now()}-${saved.length}.${ext}`;
    const diskPath = path.join(uploadsDir, safeName);
    await writeFile(diskPath, buffer);
    saved.push({ url: `/uploads/${safeName}`, name: file.name || safeName, kind });
  }

  return { saved };
}

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  name: z.string().min(2).optional(),
});

export async function registerAction(formData: FormData) {
  const parsed = credSchema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
    password: String(formData.get("password") || ""),
    name: String(formData.get("name") || "").trim(),
  });
  if (!parsed.success || !parsed.data.name) {
    return { error: "تحقق من الاسم والبريد وكلمة المرور" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "هذا البريد مسجّل مسبقًا" };

  const count = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      name: parsed.data.name,
      initial: initialFromName(parsed.data.name),
      color: USER_COLORS[count % USER_COLORS.length]!,
    },
  });

  await createSession(user.id);
  redirect("/teams");
}

export async function loginAction(formData: FormData) {
  const parsed = credSchema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.success) return { error: "بيانات غير صحيحة" };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "البريد أو كلمة المرور غير صحيحة" };
  }

  await createSession(user.id);
  redirect("/teams");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const forgotPasswordSchema = z.object({ email: z.string().email() });

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
  });
  if (!parsed.success) return { error: "أدخل بريدًا إلكترونيًا صحيحًا" };

  const token = await createPasswordResetToken(parsed.data.email);
  if (token) {
    const hdrs = await headers();
    const host = hdrs.get("host") || "localhost:3000";
    const proto = hdrs.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const base = process.env.APP_URL || `${proto}://${host}`;
    // No email provider is configured; the reset link is written to the
    // server log so only whoever runs the server can retrieve it.
    console.info(`[password-reset] ${parsed.data.email} -> ${base}/reset-password?token=${token}`);
  }

  // Always return the same message, whether or not the email exists,
  // so this endpoint can't be used to enumerate registered accounts.
  return {
    success: "إذا كان البريد مسجلاً لدينا، تحقق من سجلات الخادم للحصول على رابط إعادة التعيين.",
  };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(4),
});

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") || ""),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.success) return { error: "بيانات غير صحيحة" };

  const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!ok) return { error: "الرابط غير صالح أو منتهي الصلاحية" };

  redirect("/login");
}

export async function createTeamAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "اكتب اسم الفريق" };

  const team = await prisma.team.create({
    data: {
      name,
      memberships: {
        create: { userId: user.id, role: "owner", basePoints: 0 },
      },
    },
  });

  redirect(`/t/${team.id}`);
}

export async function joinTeamAction(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("code") || "").trim();
  if (!code) return { error: "أدخل رمز الدعوة" };

  const team = await prisma.team.findUnique({ where: { inviteCode: code } });
  if (!team) return { error: "رمز الدعوة غير صالح" };

  const existing = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: team.id } },
  });
  if (existing?.blocked) {
    return { error: "تم حظرك من هذا الفريق" };
  }

  await prisma.membership.upsert({
    where: { userId_teamId: { userId: user.id, teamId: team.id } },
    create: { userId: user.id, teamId: team.id, role: "member" },
    update: {},
  });

  redirect(`/t/${team.id}`);
}

export async function blockMemberAction(teamId: string, memberUserId: string) {
  const user = await requireUser();

  const owner = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!owner || owner.blocked || owner.role !== "owner") {
    return { error: "غير مصرح لك بإدارة هذا الفريق" };
  }
  if (memberUserId === user.id) {
    return { error: "لا يمكنك حظر نفسك" };
  }

  await prisma.membership.update({
    where: { userId_teamId: { userId: memberUserId, teamId } },
    data: { blocked: true },
  });

  revalidatePath(`/t/${teamId}/admin`);
  return { ok: true as const };
}

export async function unblockMemberAction(teamId: string, memberUserId: string) {
  const user = await requireUser();

  const owner = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!owner || owner.blocked || owner.role !== "owner") {
    return { error: "غير مصرح لك بإدارة هذا الفريق" };
  }

  await prisma.membership.update({
    where: { userId_teamId: { userId: memberUserId, teamId } },
    data: { blocked: false },
  });

  revalidatePath(`/t/${teamId}/admin`);
  return { ok: true as const };
}

export async function createTaskAction(input: {
  teamId: string;
  title: string;
  desc: string;
  category: string;
}) {
  const user = await requireUser();
  const title = input.title.trim();
  if (!title) return { error: "اكتب عنوان المهمة أولًا" };
  if (!CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])) {
    return { error: "تصنيف غير صالح" };
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: input.teamId } },
  });
  if (!membership) return { error: "لست عضوًا في هذا الفريق" };

  await prisma.task.create({
    data: {
      title,
      desc: input.desc.trim(),
      category: input.category,
      status: "running",
      startedAt: new Date(),
      teamId: input.teamId,
      ownerId: user.id,
    },
  });

  revalidatePath(`/t/${input.teamId}`);
  return { ok: true as const };
}

export async function deleteTaskAction(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "المهمة غير موجودة" };
  if (task.ownerId !== user.id) return { error: "فقط صاحب المهمة يمكنه حذفها" };
  if (task.status !== "running") {
    return { error: "لا يمكن حذف مهمة بعد إنهائها" };
  }

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath(`/t/${task.teamId}`);
  return { ok: true as const };
}

export async function finishTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const textFormat = parseTextFormat(formData.get("textFormat"));
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!taskId) return { error: "المهمة غير موجودة" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { submission: true },
  });
  if (!task) return { error: "المهمة غير موجودة" };
  if (task.ownerId !== user.id) return { error: "فقط صاحب المهمة يمكنه إنهاؤها" };
  if (task.status !== "running") return { error: "المهمة ليست قيد التنفيذ" };
  if (task.submission) return { error: "تم إرفاق إثبات لهذه المهمة مسبقًا" };

  if (!text && files.length === 0) {
    return { error: "أرفق نصًا أو صورة كإثبات للعمل" };
  }

  const imageCount = files.filter((f) => ALLOWED_IMAGE_TYPES[f.type]).length;
  const videoCount = files.filter((f) => ALLOWED_VIDEO_TYPES[f.type]).length;
  const spreadsheetCount = files.filter((f) => isSpreadsheetFile(f)).length;
  if (imageCount > MAX_IMAGES_PER_SUBMISSION) {
    return { error: `الحد الأقصى ${MAX_IMAGES_PER_SUBMISSION} صور لكل إثبات` };
  }
  if (videoCount > MAX_VIDEOS_PER_SUBMISSION) {
    return { error: `الحد الأقصى ${MAX_VIDEOS_PER_SUBMISSION} فيديوهات لكل إثبات` };
  }
  if (spreadsheetCount > MAX_SPREADSHEETS_PER_SUBMISSION) {
    return { error: `الحد الأقصى ${MAX_SPREADSHEETS_PER_SUBMISSION} ملفات إكسل لكل إثبات` };
  }

  const result = await validateAndSaveFiles(files, taskId);
  if ("error" in result) return { error: result.error };
  const { saved } = result;

  const type = text && saved.length ? "both" : saved.length ? "media" : "text";
  const elapsedMs = Date.now() - task.startedAt.getTime();

  await prisma.$transaction([
    prisma.submission.create({
      data: {
        taskId,
        type,
        text,
        textFormat,
        files: { create: saved },
      },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: {
        status: "review",
        elapsedMs,
      },
    }),
  ]);

  const submission = await prisma.submission.findUniqueOrThrow({
    where: { taskId },
    include: { files: true },
  });

  revalidatePath(`/t/${task.teamId}`);
  return {
    ok: true as const,
    elapsedMs,
    submission: toSubmissionDTO(submission),
  };
}

export async function editSubmissionAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const textFormat = parseTextFormat(formData.get("textFormat"));
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const removeFileIds = String(formData.get("removeFileIds") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!taskId) return { error: "المهمة غير موجودة" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { submission: { include: { files: true } } },
  });
  if (!task) return { error: "المهمة غير موجودة" };
  if (task.ownerId !== user.id) return { error: "فقط صاحب المهمة يمكنه تعديل إثباتها" };
  if (!task.submission) return { error: "لا يوجد إثبات لتعديله بعد" };

  const keptFiles = task.submission.files.filter((f) => !removeFileIds.includes(f.id));

  if (!text && files.length === 0 && keptFiles.length === 0) {
    return { error: "أرفق نصًا أو صورة كإثبات للعمل" };
  }

  const imageCount =
    keptFiles.filter((f) => f.kind === "image").length +
    files.filter((f) => ALLOWED_IMAGE_TYPES[f.type]).length;
  const videoCount =
    keptFiles.filter((f) => f.kind === "video").length +
    files.filter((f) => ALLOWED_VIDEO_TYPES[f.type]).length;
  const spreadsheetCount =
    keptFiles.filter((f) => f.kind === "spreadsheet").length +
    files.filter((f) => isSpreadsheetFile(f)).length;
  if (imageCount > MAX_IMAGES_PER_SUBMISSION) {
    return { error: `الحد الأقصى ${MAX_IMAGES_PER_SUBMISSION} صور لكل إثبات` };
  }
  if (videoCount > MAX_VIDEOS_PER_SUBMISSION) {
    return { error: `الحد الأقصى ${MAX_VIDEOS_PER_SUBMISSION} فيديوهات لكل إثبات` };
  }
  if (spreadsheetCount > MAX_SPREADSHEETS_PER_SUBMISSION) {
    return { error: `الحد الأقصى ${MAX_SPREADSHEETS_PER_SUBMISSION} ملفات إكسل لكل إثبات` };
  }

  const result = await validateAndSaveFiles(files, taskId);
  if ("error" in result) return { error: result.error };
  const { saved } = result;

  const filesToRemove = task.submission.files.filter((f) => removeFileIds.includes(f.id));
  for (const f of filesToRemove) {
    await unlink(path.join(process.cwd(), "public", f.url)).catch(() => {});
  }

  const totalFiles = keptFiles.length + saved.length;
  const type = text && totalFiles ? "both" : totalFiles ? "media" : "text";

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
      data: { type, text, textFormat, files: { create: saved } },
    }),
  ]);

  const submission = await prisma.submission.findUniqueOrThrow({
    where: { taskId },
    include: { files: true },
  });

  revalidatePath(`/t/${task.teamId}`);
  return {
    ok: true as const,
    submission: toSubmissionDTO(submission),
  };
}

export async function rateTaskAction(taskId: string, stars: number) {
  const user = await requireUser();
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { error: "اختر عدد النجوم أولًا" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });
  if (!task) return { error: "المهمة غير موجودة" };
  if (task.status === "running") return { error: "المهمة ليست بانتظار التقييم" };
  if (task.ownerId === user.id) return { error: "لا يمكنك تقييم مهمتك" };

  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: task.teamId } },
  });
  if (!membership) return { error: "لست عضوًا في هذا الفريق" };

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
  const avgStars =
    ratings.reduce((a, r) => a + r.stars, 0) / ratings.length;

  revalidatePath(`/t/${task.teamId}`);
  return { ok: true as const, stars: avgStars, count: ratings.length };
}

export async function loadTeamAction(teamId: string) {
  const user = await requireUser();
  return getTeamPayload(user.id, teamId);
}

export async function updateAvatarAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "اختر صورة أولًا" };
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return { error: "صيغة الصورة غير مدعومة (JPEG / PNG / WebP / GIF)" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "حجم الصورة أكبر من 15 ميغابايت" };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadsDir, { recursive: true });
  const safeName = `${user.id}-${Date.now()}.${ext}`;
  const diskPath = path.join(uploadsDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  const current = await prisma.user.findUnique({ where: { id: user.id } });
  if (current?.avatarUrl) {
    await unlink(path.join(process.cwd(), "public", current.avatarUrl)).catch(
      () => {},
    );
  }

  const avatarUrl = `/uploads/avatars/${safeName}`;
  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
  });
  for (const m of memberships) revalidatePath(`/t/${m.teamId}`);

  return { ok: true as const, avatarUrl };
}
