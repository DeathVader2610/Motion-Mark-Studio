"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { publicPath } from "@/lib/visit";
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path.startsWith("/admin") || path.startsWith("/auth")
    ? null
    : children;
}
function subscribe(listener: () => void) {
  window.addEventListener("mm-consent", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("mm-consent", listener);
    window.removeEventListener("storage", listener);
  };
}
function consentSnapshot() {
  try {
    return localStorage.getItem("mm-analytics");
  } catch {
    return "no";
  }
}
export function VisitConsent() {
  const path = usePathname();
  const choice = useSyncExternalStore(
    subscribe,
    consentSnapshot,
    () => "loading",
  );
  const sent = useRef("");
  useEffect(() => {
    if (
      choice !== "yes" ||
      !publicPath(path) ||
      navigator.doNotTrack === "1" ||
      sent.current === path
    )
      return;
    sent.current = path;
    try {
      let visitor = sessionStorage.getItem("mm-visit");
      if (!visitor) {
        visitor = crypto.randomUUID();
        sessionStorage.setItem("mm-visit", visitor);
      }
      void fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: crypto.randomUUID(), visitor, path }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [path, choice]);
  if (!publicPath(path)) return null;
  function choose(value: string) {
    try {
      localStorage.setItem("mm-analytics", value);
      if (value === "no") sessionStorage.removeItem("mm-visit");
    } catch {}
    sent.current = "";
    window.dispatchEvent(new Event("mm-consent"));
  }
  if (choice === null)
    return (
      <aside
        className="analytics-consent"
        aria-label="Anonymous visitor statistics"
      >
        <div>
          <strong>Help us improve the studio website.</strong>
          <p>
            Allow anonymous visit counts? No advertising tracking.{" "}
            <Link href="/privacy">Privacy details</Link>
          </p>
        </div>
        <button className="button small secondary" onClick={() => choose("no")}>
          No thanks
        </button>
        <button className="button small" onClick={() => choose("yes")}>
          Allow statistics
        </button>
      </aside>
    );
  return path === "/privacy" ? (
    <div className="container analytics-preference">
      <p>Anonymous visit statistics: {choice === "yes" ? "allowed" : "off"}</p>
      <button
        className="button small secondary"
        onClick={() => choose(choice === "yes" ? "no" : "yes")}
      >
        {choice === "yes" ? "Turn off statistics" : "Allow statistics"}
      </button>
    </div>
  ) : null;
}
