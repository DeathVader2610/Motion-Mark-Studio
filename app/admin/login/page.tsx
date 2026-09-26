import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin-forms";
import { googleLogin } from "../team-actions";
export const metadata = {
  title: "Studio Login",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <div className="studio-login">
      <div className="login-art">
        <span className="brand-icon" />
        <p className="eyebrow">MOTION MARK / THE WORKSPACE</p>
        <h2>
          Good work.
          <br />
          Great people.
          <br />
          <span className="serif">One studio.</span>
        </h2>
        <p>Your projects, your team, your next big idea.</p>
      </div>
      <div className="login-content">
        {error && (
          <p role="alert" className="form-error">
            This sign-in link could not be used. Request a new invitation or try
            signing in again.
          </p>
        )}
        <LoginForm />
        {process.env.GOOGLE_LOGIN_ENABLED === "true" && (
          <form action={googleLogin}>
            <button className="button secondary">Continue with Google ↗</button>
          </form>
        )}
        <p>
          Want to work with us?{" "}
          <Link href="/join" className="text-link">
            Request to join ↗
          </Link>
        </p>
        <Link href="/" className="text-link">
          Back to the website
        </Link>
      </div>
    </div>
  );
}
