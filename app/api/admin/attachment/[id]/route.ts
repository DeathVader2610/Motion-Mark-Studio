import { can } from "@/lib/workspace";
import { getAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "enquiries.read"))
    return new Response("Unauthorised", { status: 403 });
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id))
    return new Response("Not found", { status: 404 });
  const [row] = await query<{
    attachment: Buffer;
    attachment_name: string;
    attachment_type: string;
  }>(
    "SELECT attachment,attachment_name,attachment_type FROM enquiries WHERE id=$1",
    [id],
  );
  if (!row?.attachment) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.attachment), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${row.attachment_name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
