import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { siteOrigin } from "@/lib/site-url";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    const c = await supabaseServer();
    const { error } = await c.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/admin", siteOrigin()));
  }
  return NextResponse.redirect(
    new URL("/admin/login?error=google", siteOrigin()),
  );
}
