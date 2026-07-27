#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.TASKGAME_BASE_URL || "http://localhost:3000";

let token: string | null = null;

function text(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function errorText(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true };
}

async function api(
  path: string,
  init?: RequestInit & { auth?: boolean },
) {
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
  "finish_task",
  {
    title: "إنهاء مهمة (إرفاق إثبات)",
    description:
      "أنهِ مهمة قيد التنفيذ عائدة لك بإرفاق إثبات إنجاز (نص و/أو صور). تنتقل المهمة إلى حالة review بانتظار تقييم أحد الزملاء. تُعيد الأداة خيارات الخطوة التالية.",
    inputSchema: {
      taskId: z.string(),
      text: z.string().default("").describe("وصف نصي لما تم إنجازه"),
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
  async ({ taskId, text: proofText, images }) => {
    const data = await api(`/tasks/${encodeURIComponent(taskId)}/finish`, {
      method: "POST",
      body: JSON.stringify({ text: proofText, images }),
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

async function main() {
  await tryAutoLogin();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
