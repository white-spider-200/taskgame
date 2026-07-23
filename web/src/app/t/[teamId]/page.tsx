import { redirect } from "next/navigation";
import { Playground } from "@/components/Playground";
import { getSessionUser } from "@/lib/auth";
import { getTeamPayload } from "@/lib/team";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { teamId } = await params;
  const payload = await getTeamPayload(user.id, teamId);
  if (!payload) redirect("/teams");

  return <Playground initial={payload} />;
}
