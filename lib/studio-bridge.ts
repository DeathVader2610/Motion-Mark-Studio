import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { z } from "zod";
import { query, transaction } from "./db";
import { contentSchema } from "./schema";
import { contactSchema, officialContact } from "./contact";

export function bridgeAuthorized(header: string | null, expected = process.env.STUDIO_APP_BRIDGE_TOKEN) {
  if (!expected || expected.length < 32 || !header?.startsWith("Bearer ")) return false;
  return timingSafeEqual(createHash("sha256").update(header.slice(7)).digest(), createHash("sha256").update(expected).digest());
}
export async function websiteAnalytics() {
  const [daily, topPages, enquiries] = await Promise.all([
    query<{ day: string; views: number; visits: number }>(`SELECT to_char(d,'YYYY-MM-DD') AS day,count(v.event_id)::int views,count(DISTINCT v.visitor_hash)::int visits FROM generate_series((now() at time zone 'UTC')::date-29,(now() at time zone 'UTC')::date,'1 day') d LEFT JOIN site_visits v ON v.day=d::date GROUP BY d ORDER BY d`),
    query<{ path: string; views: number }>("SELECT path,count(*)::int views FROM site_visits WHERE day>=(now() at time zone 'UTC')::date-29 GROUP BY path ORDER BY views DESC LIMIT 10"),
    query<{ count: number }>("SELECT count(*)::int count FROM enquiries WHERE created_at >= ((now() at time zone 'UTC')::date-29) at time zone 'UTC'"),
  ]);
  return { generatedAt: new Date().toISOString(), period: "Last 30 days · UTC", pageViews: daily.reduce((n,d)=>n+d.views,0), visits: daily.reduce((n,d)=>n+d.visits,0), enquiries: enquiries[0].count, daily: daily.map(({day,views})=>({day,views})), topPages };
}
const version = z.string().datetime({ offset: true });
export const bridgeMutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("content.save"), expectedUpdatedAt: version.nullable(), content: contentSchema }).strict(),
  z.object({ action: z.literal("enquiry.status"), id: z.string().uuid(), status: z.enum(["new","contacted","in-progress","closed"]), expectedUpdatedAt: version }).strict(),
  z.object({ action: z.literal("settings.contact"), contact: contactSchema, expectedUpdatedAt: version.nullable() }).strict(),
]);
export async function mutateWebsite(input: z.infer<typeof bridgeMutation>, actor: string) {
  return transaction(async c => {
    let target = "contact";
    if (input.action === "content.save") {
      const { id = randomUUID(), kind, slug, title, status, data } = input.content; target = id;
      if (input.expectedUpdatedAt) {
        const changed = await c.query("UPDATE content SET slug=$1,title=$2,status=$3,data=$4,updated_at=now() WHERE id=$5 AND kind=$6 AND updated_at=$7 RETURNING id", [slug,title,status,JSON.stringify(data),id,kind,input.expectedUpdatedAt]);
        if (!changed.rowCount) throw new Error("CONFLICT");
      } else await c.query("INSERT INTO content(id,kind,slug,title,status,data) VALUES($1,$2,$3,$4,$5,$6)",[id,kind,slug,title,status,JSON.stringify(data)]);
    } else if (input.action === "enquiry.status") {
      target = input.id;
      const changed = await c.query("UPDATE enquiries SET status=$1,updated_at=now() WHERE id=$2 AND updated_at=$3 RETURNING id",[input.status,input.id,input.expectedUpdatedAt]);
      if (!changed.rowCount) throw new Error("CONFLICT");
    } else {
      if (input.expectedUpdatedAt) {
        const changed = await c.query("UPDATE settings SET value=$1,updated_at=now() WHERE key='contact' AND updated_at=$2 RETURNING key", [JSON.stringify(input.contact),input.expectedUpdatedAt]);
        if (!changed.rowCount) throw new Error("CONFLICT");
      } else await c.query("INSERT INTO settings(key,value) VALUES('contact',$1)",[JSON.stringify(input.contact)]);
    }
    await c.query("INSERT INTO audit_log(id,actor,action,target) VALUES($1,$2,$3,$4)",[randomUUID(),`studio-app:${actor}`,input.action,target]);
    return { ok: true, id: target };
  });
}
export async function readWebsite(resource: string, offset: number) {
  if (resource === "analytics") return websiteAnalytics();
  if (resource === "content") return { items: await query(`SELECT id,kind,slug,title,status,data,to_char(updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as updated_at FROM content ORDER BY created_at DESC,id LIMIT 50 OFFSET $1`,[offset]), total: (await query<{count:number}>("SELECT count(*)::int count FROM content"))[0].count };
  if (resource === "enquiries") return { items: await query(`SELECT id,status,data,created_at,to_char(updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as updated_at,attachment_name FROM enquiries ORDER BY created_at DESC,id LIMIT 50 OFFSET $1`,[offset]), total: (await query<{count:number}>("SELECT count(*)::int count FROM enquiries"))[0].count };
  if (resource === "settings") return (await query(`SELECT value,to_char(updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as updated_at FROM settings WHERE key='contact'`))[0] ?? { value: officialContact, updated_at: null };
  throw new Error("Unknown resource");
}
