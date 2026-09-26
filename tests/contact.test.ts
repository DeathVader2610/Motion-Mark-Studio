import test from "node:test";
import assert from "node:assert/strict";
import { contactSchema, contactLinks, officialContact } from "../lib/contact";
import { enquirySchema, csvCell, contentSchema } from "../lib/schema";
import { validateBrief } from "../lib/uploads";
test("official links are exact and have no tracking parameters", () => {
  assert.deepEqual(contactLinks(officialContact), {
    phone: "tel:+919546960044",
    email: "mailto:motionmarkstudio1@gmail.com",
    whatsapp: "https://wa.me/919546960044",
    instagram: "https://www.instagram.com/motionmark.studio/",
  });
});
test("admin contact change propagates to every generated link", () => {
  const changed = contactSchema.parse({
    ...officialContact,
    phone: "+44 (20) 1234-5678",
    email: "studio@example.com",
    instagramHandle: "@updated.studio",
  });
  const links = contactLinks(changed);
  assert.equal(links.phone, "tel:+442012345678");
  assert.equal(links.email, "mailto:studio@example.com");
  assert.equal(links.instagram, "https://www.instagram.com/updated.studio/");
});
test("settings reject injected URLs and invalid phone / email", () => {
  for (const change of [
    { instagramHandle: "@motionmark.studio/?utm_source=test" },
    { email: "a@example.com\r\nBcc: x@example.com" },
    { phone: "javascript:alert(1)" },
  ])
    assert.equal(
      contactSchema.safeParse({ ...officialContact, ...change }).success,
      false,
    );
});
test("enquiries require real consent, valid email and meaningful brief", () => {
  const valid = {
    fullName: "Test Client",
    business: "Test Brand",
    email: "client@example.com",
    phone: "+919999999999",
    contactMethod: "Email",
    website: "",
    service: "Photography",
    projectType: "Campaign",
    budget: "Let’s discuss",
    deadline: "",
    location: "Jamshedpur",
    description: "A carefully scoped test enquiry for our upcoming campaign.",
    consent: true,
  };
  assert.equal(enquirySchema.safeParse(valid).success, true);
  for (const change of [
    { consent: false },
    { description: "short" },
    { email: "wrong" },
    { website: "javascript:alert(1)" },
  ])
    assert.equal(
      enquirySchema.safeParse({ ...valid, ...change }).success,
      false,
    );
});
test("CSV export escapes spreadsheet formulas and embedded quotes", () => {
  assert.equal(csvCell('=IMPORTXML("a")'), '"\'=IMPORTXML(""a"")"');
  assert.equal(csvCell(" \t+123"), '"\' \t+123"');
  assert.equal(csvCell('Jane "J" Doe'), '"Jane ""J"" Doe"');
});
test("uploaded briefs reject spoofed content, oversized files and unsafe names", () => {
  assert.throws(() =>
    validateBrief("brief.pdf", "application/pdf", Buffer.from("<script>")),
  );
  assert.throws(() =>
    validateBrief(
      "brief.pdf",
      "application/pdf",
      Buffer.alloc(3 * 1024 * 1024 + 1),
    ),
  );
  assert.equal(
    validateBrief(
      "../brief.pdf",
      "application/pdf",
      Buffer.from("%PDF-1.7 content"),
    ),
    ".._brief.pdf",
  );
});
test("content is published only through explicit status and safe URLs", () => {
  assert.equal(
    contentSchema.safeParse({
      kind: "project",
      title: "Test",
      slug: "test",
      status: "published",
      data: { image: "javascript:alert(1)" },
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      kind: "project",
      title: "Test",
      slug: "test",
      status: "draft",
      data: {},
    }).success,
    true,
  );
});
