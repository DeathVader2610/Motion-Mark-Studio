import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { query } from "../lib/db";
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const role = process.argv[3] || "owner";
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !["owner", "editor"].includes(role)
  )
    throw new Error(
      "Usage: npm run admin:create -- you@example.com [owner|editor]",
    );
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  )
    throw new Error("Configure Supabase credentials in .env.local first.");
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user)
    throw new Error(error?.message || "Could not create user");
  try {
    await query("INSERT INTO admins(id,email,role) VALUES($1,$2,$3)", [
      data.user.id,
      email,
      role,
    ]);
  } catch {
    await client.auth.admin.deleteUser(data.user.id);
    throw new Error("Could not save admin role. Run migrations first.");
  }
  console.log(
    `Admin created: ${email}\nGenerated password (store securely): ${password}\nChange it in Admin → Account after signing in.`,
  );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
