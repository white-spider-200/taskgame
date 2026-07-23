import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getSessionUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <RegisterForm />;
}
