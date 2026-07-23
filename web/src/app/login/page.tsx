import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <LoginForm />;
}
