import { redirect } from "next/navigation";

export default async function TeamAdminPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  redirect(`/t/${teamId}/admin/users`);
}
