import { notFound, redirect } from "next/navigation";
import { TaskDetail } from "@/components/TaskDetail";
import { getSessionUser } from "@/lib/auth";
import { getTeamPayload } from "@/lib/team";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; taskId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { teamId, taskId } = await params;
  const payload = await getTeamPayload(user.id, teamId);
  if (!payload) redirect("/teams");

  const task = payload.tasks.find((t) => t.id === taskId);
  if (!task) notFound();

  return <TaskDetail teamId={teamId} initial={payload} taskId={taskId} />;
}
