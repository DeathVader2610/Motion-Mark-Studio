import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin-forms";
export const metadata = {
  title: "Studio Login",
  robots: { index: false, follow: false },
};
export default async function Login() {
  if (await getAdmin()) redirect("/admin");
  return <LoginForm />;
}
