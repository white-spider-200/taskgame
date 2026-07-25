"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES, USER_COLORS, initialFromName } from "@/lib/format";
import { getTeamPayload } from "@/lib/team";

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
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

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

  await prisma.membership.upsert({
    where: { userId_teamId: { userId: user.id, teamId: team.id } },
    create: { userId: user.id, teamId: team.id, role: "member" },
    update: {},
  });

  redirect(`/t/${team.id}`);
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

export async function finishTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const file = formData.get("file");

  if (!taskId) return { error: "المهمة غير موجودة" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { submission: true },
  });
  if (!task) return { error: "المهمة غير موجودة" };
  if (task.ownerId !== user.id) return { error: "فقط صاحب المهمة يمكنه إنهاؤها" };
  if (task.status !== "running") return { error: "المهمة ليست قيد التنفيذ" };
  if (task.submission) return { error: "تم إرفاق إثبات لهذه المهمة مسبقًا" };

  const hasFile = file instanceof File && file.size > 0;
  if (!text && !hasFile) {
    return { error: "أرفق نصًا أو صورة كإثبات للعمل" };
  }

  let fileUrl: string | null = null;
  let fileName: string | null = null;

  let fileKind: "image" | "video" | null = null;

  if (hasFile) {
    const mime = file.type;
    const imageExt = ALLOWED_IMAGE_TYPES[mime];
    const videoExt = ALLOWED_VIDEO_TYPES[mime];
    if (!imageExt && !videoExt) {
      return { error: "صيغة الملف غير مدعومة (JPEG / PNG / WebP / GIF / MP4 / WebM / MOV)" };
    }
    fileKind = imageExt ? "image" : "video";
    const ext = imageExt ?? videoExt!;
    const maxBytes = fileKind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return {
        error:
          fileKind === "video"
            ? "حجم الفيديو أكبر من 50 ميغابايت"
            : "حجم الصورة أكبر من 5 ميغابايت",
      };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const safeName = `${taskId}-${Date.now()}.${ext}`;
    const diskPath = path.join(uploadsDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, buffer);
    fileUrl = `/uploads/${safeName}`;
    fileName = file.name || safeName;
  }

  const type = text && fileUrl ? "both" : fileKind ?? "text";
  const elapsedMs = Date.now() - task.startedAt.getTime();

  await prisma.$transaction([
    prisma.submission.create({
      data: {
        taskId,
        type,
        text,
        fileUrl,
        fileName,
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

  revalidatePath(`/t/${task.teamId}`);
  return {
    ok: true as const,
    elapsedMs,
    submission: { type: type as "text" | "image" | "both", text, fileUrl, fileName },
  };
}

export async function editSubmissionAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const file = formData.get("file");

  if (!taskId) return { error: "المهمة غير موجودة" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { submission: true },
  });
  if (!task) return { error: "المهمة غير موجودة" };
  if (task.ownerId !== user.id) return { error: "فقط صاحب المهمة يمكنه تعديل إثباتها" };
  if (!task.submission) return { error: "لا يوجد إثبات لتعديله بعد" };

  const hasFile = file instanceof File && file.size > 0;
  let fileUrl = task.submission.fileUrl;
  let fileName = task.submission.fileName;
  let fileKind: "image" | "video" | null = fileUrl
    ? /\.(mp4|webm|mov)$/i.test(fileUrl)
      ? "video"
      : "image"
    : null;

  if (!text && !hasFile && !fileUrl) {
    return { error: "أرفق نصًا أو صورة كإثبات للعمل" };
  }

  if (hasFile) {
    const mime = file.type;
    const imageExt = ALLOWED_IMAGE_TYPES[mime];
    const videoExt = ALLOWED_VIDEO_TYPES[mime];
    if (!imageExt && !videoExt) {
      return { error: "صيغة الملف غير مدعومة (JPEG / PNG / WebP / GIF / MP4 / WebM / MOV)" };
    }
    fileKind = imageExt ? "image" : "video";
    const ext = imageExt ?? videoExt!;
    const maxBytes = fileKind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return {
        error:
          fileKind === "video"
            ? "حجم الفيديو أكبر من 50 ميغابايت"
            : "حجم الصورة أكبر من 5 ميغابايت",
      };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const safeName = `${taskId}-${Date.now()}.${ext}`;
    const diskPath = path.join(uploadsDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, buffer);

    const oldFileUrl = task.submission.fileUrl;
    if (oldFileUrl) {
      await unlink(path.join(process.cwd(), "public", oldFileUrl)).catch(() => {});
    }

    fileUrl = `/uploads/${safeName}`;
    fileName = file.name || safeName;
  }

  const type = text && fileUrl ? "both" : fileKind ?? "text";

  await prisma.submission.update({
    where: { taskId },
    data: { type, text, fileUrl, fileName },
  });

  revalidatePath(`/t/${task.teamId}`);
  return {
    ok: true as const,
    submission: {
      type: type as "text" | "image" | "video" | "both",
      text,
      fileUrl,
      fileName,
    },
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
      data: { status: "done" },
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
    return { error: "حجم الصورة أكبر من 5 ميغابايت" };
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
