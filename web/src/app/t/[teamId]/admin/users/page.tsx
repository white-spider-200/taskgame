import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { TeamAdminUsers } from "@/components/admin/TeamAdminUsers";
import { getSessionUser } from "@/lib/auth";
import { getTeamAdminPayload } from "@/lib/admin";

export default async function TeamAdminUsersPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { teamId } = await params;
  const payload = await getTeamAdminPayload(user.id, teamId);
  if (!payload) redirect(`/t/${teamId}`);

  return (
    <AdminShell teamId={payload.team.id} teamName={payload.team.name}>
      <TeamAdminUsers teamId={payload.team.id} initial={payload.members} />
    </AdminShell>
  );
}
