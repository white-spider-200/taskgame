import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");
  const { token } = await searchParams;
  return <ResetPasswordForm token={token || ""} />;
}
