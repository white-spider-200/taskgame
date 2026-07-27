import { createSessionToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { json } from "../_util";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!email || !password) {
    return json({ error: "أدخل البريد وكلمة المرور" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return json({ error: "البريد أو كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
  return json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
