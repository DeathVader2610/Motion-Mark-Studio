import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { siteOrigin } from "@/lib/site-url";
export async function GET(request: Request) {
  const u = new URL(request.url),
    token_hash = u.searchParams.get("token_hash"),
    type = u.searchParams.get("type");
  if (token_hash && (type === "invite" || type === "magiclink")) {
    const c = await supabaseServer();
    const { error } = await c.auth.verifyOtp({ token_hash, type });
    if (!error)
      return NextResponse.redirect(new URL("/admin/setup", siteOrigin()));
  }
  return NextResponse.redirect(
    new URL("/admin/login?error=invitation", siteOrigin()),
  );
}
