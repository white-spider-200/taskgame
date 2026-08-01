import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <ForgotPasswordForm />;
}
