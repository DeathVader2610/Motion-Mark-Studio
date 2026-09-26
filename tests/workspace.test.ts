import test from "node:test";
import assert from "node:assert/strict";
import {
  can,
  isFounder,
  canAccessDepartment,
  roleSchema,
  driveFolder,
  joinSchema,
  type Member,
} from "../lib/workspace";
import { visitSchema, publicPath } from "../lib/visit";
const member: Member = {
  id: "a",
  email: "editor@example.com",
  role: "editor",
  active: true,
  display_name: "Editor",
  role_id: "r",
  role_name: "Editor",
  department_id: "editing",
  permissions: ["drive.view"],
};
test("department membership does not grant founder access or arbitrary permissions", () => {
  assert.equal(isFounder(member), false);
  assert.equal(can(member, "content.edit"), false);
  assert.equal(can(member, "drive.view"), true);
  assert.equal(canAccessDepartment(member, "videography"), false);
  assert.equal(canAccessDepartment(member, "editing"), true);
});
test("founder office has complete access; suspension revokes every capability", () => {
  const founder = { ...member, department_id: "founder-office" };
  assert.equal(isFounder(founder), true);
  assert.equal(can(founder, "enquiries.manage"), true);
  assert.equal(canAccessDepartment(founder, "photography"), true);
  assert.equal(isFounder({ ...founder, active: false }), false);
  assert.equal(can({ ...founder, active: false }, "drive.view"), false);
  assert.equal(
    canAccessDepartment({ ...founder, active: false }, "editing"),
    false,
  );
});
test("legacy owner retains oversight and non-founders cannot manufacture analytics permission", () => {
  assert.equal(isFounder({ ...member, role: "owner" }), true);
  assert.equal(
    roleSchema.safeParse({
      name: "Analyst",
      department_id: "editing",
      permissions: ["analytics.read"],
    }).success,
    false,
  );
  assert.equal(
    roleSchema.safeParse({
      name: "Enquiries",
      department_id: "editing",
      permissions: ["enquiries.manage"],
    }).success,
    false,
  );
});
test("Drive URLs are normalized and reject lookalikes and arbitrary links", () => {
  assert.equal(
    driveFolder(
      "https://drive.google.com/drive/u/0/folders/ABC123?usp=sharing",
    ),
    "https://drive.google.com/drive/folders/ABC123",
  );
  for (const url of [
    "https://drive.google.com.evil.example/drive/folders/a",
    "https://evil@drive.google.com/drive/folders/a",
    "javascript:alert(1)",
    "https://drive.google.com/file/d/a",
  ])
    assert.equal(driveFolder(url), null);
});
test("applicants cannot choose arbitrary departments or inject non-HTTPS portfolios", () => {
  const request = {
    name: "New editor",
    email: "TEST@example.com",
    department: "editing",
    portfolio: "",
    message: "Five years of editing experience",
  };
  assert.equal(joinSchema.parse(request).email, "test@example.com");
  assert.equal(
    joinSchema.safeParse({ ...request, department: "admin" }).success,
    false,
  );
  assert.equal(
    joinSchema.safeParse({ ...request, portfolio: "javascript:alert(1)" })
      .success,
    false,
  );
});
test("analytics accepts only public paths without sensitive route or query data", () => {
  for (const path of [
    "/admin",
    "/admin?tab=analytics",
    "/auth/confirm",
    "/contact?email=a",
    "//evil.example",
    "/work/../admin",
    "/join",
  ])
    assert.equal(publicPath(path), false);
  assert.equal(publicPath("/work/a-film"), true);
  assert.equal(
    visitSchema.safeParse({
      path: "/admin",
      event: crypto.randomUUID(),
      visitor: crypto.randomUUID(),
    }).success,
    false,
  );
});
import { databaseConfig } from "../lib/db-config";
test("production database connections enforce verified TLS", () => {
  const c = databaseConfig({
    DATABASE_URL:
      "postgres://user:password@db.example.com:5432/postgres?sslmode=disable",
    VERCEL: "1",
  });
  assert.equal(
    new URL(c.connectionString!).searchParams.get("sslmode"),
    "verify-full",
  );
  const ca = databaseConfig({
    DATABASE_URL:
      "postgres://user:password@db.example.com/postgres?sslmode=no-verify",
    DATABASE_SSL_CA: "CERT\\nDATA",
    VERCEL: "1",
  });
  assert.equal(
    (ca.ssl as { rejectUnauthorized: boolean }).rejectUnauthorized,
    true,
  );
  assert.equal(
    new URL(ca.connectionString!).searchParams.has("sslmode"),
    false,
  );
});
