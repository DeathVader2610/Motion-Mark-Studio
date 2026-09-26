import { isFounder } from "@/lib/workspace";
import { getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { csvCell } from "@/lib/schema";
export async function GET() {
  const admin = await getAdmin();
  if (!admin || !isFounder(admin))
    return new Response("Unauthorised", { status: 403 });
  const rows = await query<{
    id: string;
    data: Record<string, unknown>;
    status: string;
    created_at: string;
  }>(
    "SELECT id,data,status,created_at FROM enquiries ORDER BY created_at DESC",
  );
  const keys = [
    "fullName",
    "business",
    "email",
    "phone",
    "contactMethod",
    "website",
    "service",
    "projectType",
    "budget",
    "deadline",
    "location",
    "description",
    "consent",
  ];
  const csv = [
    ["id", "received", "status", ...keys].map(csvCell).join(","),
    ...rows.map((r) =>
      [r.id, r.created_at, r.status, ...keys.map((k) => r.data[k])]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="motion-mark-enquiries.csv"',
      "Cache-Control": "no-store",
    },
  });
}
