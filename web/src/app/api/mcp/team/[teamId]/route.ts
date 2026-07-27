import { getTeamPayload } from "@/lib/team";
import { isUser, json, requireBearerUser } from "../../_util";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await requireBearerUser(req);
  if (!isUser(user)) return user;

  const { teamId } = await params;
  const payload = await getTeamPayload(user.id, teamId);
  if (!payload) return json({ error: "لست عضوًا في هذا الفريق" }, { status: 404 });

  return json(payload);
}
