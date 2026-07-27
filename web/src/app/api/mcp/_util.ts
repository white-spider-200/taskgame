import { getBearerUser, type SessionUser } from "@/lib/auth";

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export async function requireBearerUser(req: Request): Promise<SessionUser | Response> {
  const user = await getBearerUser(req);
  if (!user) return json({ error: "غير مصرح" }, { status: 401 });
  return user;
}

export function isUser(u: SessionUser | Response): u is SessionUser {
  return !(u instanceof Response);
}
