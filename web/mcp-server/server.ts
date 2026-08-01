import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const BASE_URL = process.env.TASKGAME_BASE_URL || "http://localhost:3000";

function text(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function errorText(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true };
}

export async function createTaskgameServer() {
  let token: string | null = null;

  async function api(path: string, init?: RequestInit & { auth?: boolean }) {
    const needsAuth = init?.auth !== false;
    if (needsAuth && !token) {
      return { error: "لم يتم تسجيل الدخول بعد. استخدم أداة login أولًا." as const };
    }

    const res = await fetch(`${BASE_URL}/api/mcp${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(needsAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({ error: "استجابة غير صالحة من الخادم" }));
    if (!res.ok) return { error: data.error || `فشل الطلب (${res.status})` };
    return data;
  }

  async function tryAutoLogin() {
    const email = process.env.TASKGAME_EMAIL;
    const password = process.env.TASKGAME_PASSWORD;
    if (!email || !password) return;

    const data = await api("/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    if (data && typeof data === "object" && "token" in data) {
      token = (data as { token: string }).token;
    }
  }

  const server = new McpServer({
    name: "taskgame",
    version: "1.0.0",
  });

  server.registerTool(
    "login",
    {
      title: "تسجيل الدخول",
      description:
        "سجّل الدخول إلى حساب ملعب المهام باستخدام البريد وكلمة المرور. يجب استدعاؤها قبل أي أداة أخرى ما لم يتم ضبط TASKGAME_EMAIL و TASKGAME_PASSWORD كمتغيرات بيئة للدخول التلقائي.",
      inputSchema: {
        email: z.string().email(),
        password: z.string().min(1),
      },
    },
    async ({ email, password }) => {
      const data = await api("/login", { method: "POST", auth: false, body: JSON.stringify({ email, password }) });
      if ("error" in data) return errorText(data.error);
      token = data.token;
      return text({ ok: true, user: data.user });
    },
  );

  server.registerTool(
    "list_teams",
    {
      title: "عرض الفرق",
      description: "اعرض كل الفرق التي ينتمي إليها المستخدم المسجّل دخوله، مع معرّف كل فريق (teamId).",
      inputSchema: {},
    },
    async () => {
      const data = await api("/teams");
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  server.registerTool(
    "get_team",
    {
      title: "عرض حالة الفريق",
      description:
        "اجلب حالة فريق كاملة: الأعضاء ونقاطهم، وكل المهام (قيد التنفيذ/قيد المراجعة/منتهية) بما فيها إثباتات الإنجاز والتقييمات.",
      inputSchema: {
        teamId: z.string().describe("معرّف الفريق من list_teams"),
      },
    },
    async ({ teamId }) => {
      const data = await api(`/team/${encodeURIComponent(teamId)}`);
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  server.registerTool(
    "create_task",
    {
      title: "إنشاء مهمة",
      description: "أنشئ مهمة جديدة قيد التنفيذ (running) مملوكة للمستخدم الحالي في فريق معيّن.",
      inputSchema: {
        teamId: z.string(),
        title: z.string().min(1),
        desc: z.string().default(""),
        category: z.enum(["تصميم", "مبيعات", "تطوير", "إداري"]),
      },
    },
    async ({ teamId, title, desc, category }) => {
      const data = await api("/tasks", {
        method: "POST",
        body: JSON.stringify({ teamId, title, desc, category }),
      });
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  server.registerTool(
    "edit_task",
    {
      title: "تعديل مهمة",
      description:
        "عدّل عنوان أو وصف أو تصنيف مهمة قيد التنفيذ (running) عائدة لك. لا يمكن تعديل مهمة بعد إنهائها.",
      inputSchema: {
        taskId: z.string(),
        title: z.string().min(1).optional(),
        desc: z.string().optional(),
        category: z.enum(["تصميم", "مبيعات", "تطوير", "إداري"]).optional(),
      },
    },
    async ({ taskId, title, desc, category }) => {
      const data = await api(`/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        body: JSON.stringify({ title, desc, category }),
      });
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  server.registerTool(
    "edit_submission",
    {
      title: "تعديل إثبات مهمة",
      description:
        "عدّل نص أو صور إثبات مهمة عائدة لك بعد إرفاقه (قيد المراجعة أو منتهية). يمكن حذف صور قديمة عبر removeFileIds (استخدم get_team لمعرفة معرّفات الصور) وإضافة صور جديدة.",
      inputSchema: {
        taskId: z.string(),
        text: z.string().optional().describe("النص الجديد للإثبات؛ اتركه فارغًا إن أردت الإبقاء على النص الحالي"),
        format: z
          .enum(["auto", "code", "text", "markdown"])
          .optional()
          .describe(
            "كيفية عرض النص: auto (تخمين تلقائي)، code (كتلة كود مع تلوين الصياغة)، text (نص عادي)، markdown (ماركداون منسّق). اتركه فارغًا للإبقاء على الإعداد الحالي",
          ),
        removeFileIds: z.array(z.string()).default([]).describe("معرّفات الصور المراد حذفها من الإثبات"),
        images: z
          .array(
            z.object({
              name: z.string().optional(),
              mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
              dataBase64: z.string().describe("بيانات الصورة بترميز base64 بدون بادئة data:"),
            }),
          )
          .default([])
          .describe("صور جديدة تُضاف للإثبات، بحد أقصى 5 صور إجمالًا و15 ميغابايت لكل صورة"),
      },
    },
    async ({ taskId, text: proofText, format, removeFileIds, images }) => {
      const data = await api(`/tasks/${encodeURIComponent(taskId)}/submission`, {
        method: "PATCH",
        body: JSON.stringify({ text: proofText, textFormat: format, removeFileIds, images }),
      });
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  server.registerTool(
    "finish_task",
    {
      title: "إنهاء مهمة (إرفاق إثبات)",
      description:
        "أنهِ مهمة قيد التنفيذ عائدة لك بإرفاق إثبات إنجاز (نص و/أو صور). تنتقل المهمة إلى حالة review بانتظار تقييم أحد الزملاء. تُعيد الأداة خيارات الخطوة التالية.",
      inputSchema: {
        taskId: z.string(),
        text: z.string().default("").describe("وصف نصي لما تم إنجازه"),
        format: z
          .enum(["auto", "code", "text", "markdown"])
          .default("auto")
          .describe(
            "كيفية عرض النص: auto (تخمين تلقائي إن كان كودًا أم لا)، code (كتلة كود مع تلوين الصياغة)، text (نص عادي)، markdown (ماركداون منسّق)",
          ),
        images: z
          .array(
            z.object({
              name: z.string().optional(),
              mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
              dataBase64: z.string().describe("بيانات الصورة بترميز base64 بدون بادئة data:"),
            }),
          )
          .default([])
          .describe("صور اختيارية كإثبات، حتى 5 صور و15 ميغابايت لكل صورة"),
      },
    },
    async ({ taskId, text: proofText, format, images }) => {
      const data = await api(`/tasks/${encodeURIComponent(taskId)}/finish`, {
        method: "POST",
        body: JSON.stringify({ text: proofText, textFormat: format, images }),
      });
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  server.registerTool(
    "rate_task",
    {
      title: "تقييم مهمة",
      description: "قيّم مهمة زميل قيد المراجعة أو منتهية بعدد نجوم من 1 إلى 5. لا يمكنك تقييم مهمتك الخاصة.",
      inputSchema: {
        taskId: z.string(),
        stars: z.number().int().min(1).max(5),
      },
    },
    async ({ taskId, stars }) => {
      const data = await api(`/tasks/${encodeURIComponent(taskId)}/rate`, {
        method: "POST",
        body: JSON.stringify({ stars }),
      });
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  server.registerTool(
    "delete_task",
    {
      title: "حذف مهمة",
      description: "احذف مهمة عائدة لك ما زالت قيد التنفيذ (running) فقط.",
      inputSchema: {
        taskId: z.string(),
      },
    },
    async ({ taskId }) => {
      const data = await api(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      if ("error" in data) return errorText(data.error);
      return text(data);
    },
  );

  await tryAutoLogin();
  return server;
}
