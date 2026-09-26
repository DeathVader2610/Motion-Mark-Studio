"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SunMoon } from "lucide-react";
import type { TeamResult } from "@/app/admin/team-actions";
export function TeamForm({
  action,
  children,
  label = "Save changes",
  className = "",
  buttons = false,
  completed = false,
}: {
  action: (state: TeamResult, form: FormData) => Promise<TeamResult>;
  children: React.ReactNode;
  label?: string;
  className?: string;
  buttons?: boolean;
  completed?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className={`team-form ${className}`}>
      {!completed && (
        <fieldset disabled={pending}>
          {children}
          {!buttons && (
            <button className="button small" disabled={pending}>
              {pending ? "Saving…" : label}
            </button>
          )}
        </fieldset>
      )}
      {pending && buttons && <p role="status">Working…</p>}
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
        </p>
      )}
      {state.invitation && (
        <label className="invitation-link">
          One-time invitation — share privately
          <input
            readOnly
            value={state.invitation}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
    </form>
  );
}
export function DashboardLive() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 45000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
export function DashboardTheme() {
  return (
    <button
      type="button"
      className="dash-icon"
      aria-label="Toggle dashboard theme"
      onClick={() => {
        const next =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("mm-theme", next);
        } catch {}
      }}
    >
      <SunMoon size={19} />
    </button>
  );
}
