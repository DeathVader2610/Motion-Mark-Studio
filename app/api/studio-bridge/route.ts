import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bridgeAuthorized, bridgeMutation, mutateWebsite, readWebsite } from "@/lib/studio-bridge";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (data: unknown, status=200) => Response.json(data,{status,headers});
export async function GET(request: Request) {
  if (!bridgeAuthorized(request.headers.get("authorization"))) return json({error:"Unauthorized"},401);
  const params = new URL(request.url).searchParams;
  const parsed = z.object({ resource:z.enum(["analytics","content","enquiries","settings"]), offset:z.coerce.number().int().min(0).max(100000).default(0) }).safeParse(Object.fromEntries(params));
  if (!parsed.success) return json({error:"Invalid request"},400);
  try { return json(await readWebsite(parsed.data.resource,parsed.data.offset)); }
  catch { return json({error:"Website data is temporarily unavailable"},503); }
}
export async function POST(request: Request) {
  if (!bridgeAuthorized(request.headers.get("authorization"))) return json({error:"Unauthorized"},401);
  const actor = z.string().uuid().safeParse(request.headers.get("x-studio-actor"));
  if (!actor.success) return json({error:"Verified studio actor is required"},400);
  // The mobile app never receives the connector key. Only its owner-authorized API sends writes.
  const reader = request.body?.getReader();
  if (!reader) return json({error:"Request body required"},400);
  let size=0; const chunks: Uint8Array[]=[];
  try {
    while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>65536) { await reader.cancel(); return json({error:"Request too large"},413); } chunks.push(value); }
    const input = bridgeMutation.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!input.success) return json({error:"Check the submitted website fields",issues:input.error.flatten()},400);
    const result = await mutateWebsite(input.data,actor.data);
    revalidatePath("/","layout");
    return json(result);
  } catch(e) {
    if (e instanceof SyntaxError) return json({error:"Invalid JSON"},400);
    if ((e as Error).message === "CONFLICT" || (e as {code?:string}).code === "23505") return json({error:"This record changed or its slug is already in use. Refresh before saving."},409);
    return json({error:"The website could not save this change"},503);
  }
}
