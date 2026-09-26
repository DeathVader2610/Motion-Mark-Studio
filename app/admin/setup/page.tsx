import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { TeamForm } from "@/components/dashboard/forms";
import { setInitialPassword } from "../team-actions";
export default async function Setup() {
  if (!(await getAdmin())) redirect("/admin/login");
  return (
    <section className="login-form">
      <p className="eyebrow">WELCOME TO MOTION MARK</p>
      <h1>Your next chapter.</h1>
      <p>Set a password for your approved studio account.</p>
      <TeamForm
        action={setInitialPassword}
        label="Set password and enter studio"
      >
        <label>
          New password
          <input
            type="password"
            name="password"
            minLength={14}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
      </TeamForm>
    </section>
  );
}
