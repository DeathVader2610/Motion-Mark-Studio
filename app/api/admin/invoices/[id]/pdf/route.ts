import { getAdmin } from "@/lib/auth";
import { isFounder } from "@/lib/workspace";
import { getInvoice } from "@/lib/billing-data";
import { invoicePdf } from "@/lib/invoice-pdf";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getAdmin();
  if (!actor || !isFounder(actor))
    return new Response("Forbidden", { status: 403 });
  const parsed = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!parsed.success) return new Response("Not found", { status: 404 });
  const i = await getInvoice(parsed.data);
  if (!i) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(await invoicePdf(i)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${i.number || "draft-" + i.id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
