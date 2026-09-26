import { randomUUID } from "node:crypto";
import { getAdmin, sameOrigin } from "@/lib/auth";
import { boundedForm, validateBrief } from "@/lib/uploads";
import { supabaseStorage } from "@/lib/supabase";
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await getAdmin()))
    return Response.json({ error: "Unauthorised" }, { status: 403 });
  try {
    const form = await boundedForm(request);
    const file = form.get("image");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png"].includes(file.type)
    )
      return Response.json(
        { error: "Upload a JPG or PNG, up to 3 MB." },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const name = validateBrief(file.name, file.type, bytes);
    const storage = supabaseStorage();
    const key = `${randomUUID()}-${name}`;
    const { error } = await storage.storage
      .from("portfolio")
      .upload(key, bytes, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) throw error;
    return Response.json({
      url: storage.storage.from("portfolio").getPublicUrl(key).data.publicUrl,
    });
  } catch {
    return Response.json(
      {
        error:
          "Could not upload. Check the image, Supabase Storage configuration and the 3 MB limit.",
      },
      { status: 400 },
    );
  }
}
