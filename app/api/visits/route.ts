import { createHmac } from "node:crypto";
import { sameOrigin, rateLimit, hashToken } from "@/lib/auth";
import { query } from "@/lib/db";
import { visitSchema } from "@/lib/visit";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (!process.env.DATABASE_URL || !process.env.ANALYTICS_SALT)
    return new Response(null, { status: 204 });
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return new Response(null, { status: 403 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 1024)
      return new Response(null, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
    const input = visitSchema.safeParse(
      JSON.parse(Buffer.concat(chunks).toString()),
    );
    if (!input.success) return new Response(null, { status: 400 });
    if (
      /bot|crawler|spider|headless/i.test(
        request.headers.get("user-agent") || "",
      )
    )
      return new Response(null, { status: 204 });
    const ip = process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for") || "unknown"
      : "local";
    if (!(await rateLimit(`visits:${hashToken(ip)}`, 120, 3600)))
      return new Response(null, { status: 429 });
    const day = new Date().toISOString().slice(0, 10),
      d = input.data;
    const hash = createHmac("sha256", process.env.ANALYTICS_SALT)
      .update(`${day}:${d.visitor}`)
      .digest("hex");
    await query(
      "INSERT INTO site_visits(event_id,day,visitor_hash,path) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
      [d.event, day, hash, d.path],
    );
    await query("DELETE FROM site_visits WHERE day<current_date-90");
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
