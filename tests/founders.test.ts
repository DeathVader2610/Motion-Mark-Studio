import test from "node:test";
import assert from "node:assert/strict";
import { defaultFounders, publishedFounders, instagramProfile } from "../lib/founders";
import { contentSchema } from "../lib/schema";
import { existsSync } from "node:fs";

test("approved profiles have real assets and stable display ordering", () => {
  assert.deepEqual(publishedFounders([...defaultFounders].reverse()).map(f => f.title), ["Sameer Thripathi", "Shrey Ranjan"]);
  for (const founder of defaultFounders) assert.ok(existsSync(`public${founder.data.image}`));
  assert.equal(publishedFounders(defaultFounders.map(f => ({ ...f, status: "archived" }))).length, 0);
});
test("founder edits round trip and reject unsafe portrait paths", () => {
  const founder = defaultFounders[0];
  const edited = contentSchema.parse({ ...founder, data: { ...founder.data, highlights: ["Updated experience"], imageAlt: "Updated portrait", sortOrder: 8, portraitPosition: "center", url: "" } });
  assert.equal(edited.data.sortOrder, 8);
  assert.deepEqual(edited.data.highlights, ["Updated experience"]);
  assert.equal(edited.data.imageAlt, "Updated portrait");
  assert.equal(edited.data.portraitPosition, "center");
  for (const image of ["//evil.example/photo.jpg", "/founders/../secret.jpg", "javascript:alert(1)"]) assert.equal(contentSchema.safeParse({ ...founder, data: { ...founder.data, image } }).success, false);
});
test("only supplied Instagram profiles become clean links", () => {
  assert.equal(instagramProfile("https://www.instagram.com/iamsameer07_/?hl=en"), "https://www.instagram.com/iamsameer07_/");
  for (const value of [undefined, "", "https://evil.example/user/", "https://instagram.com@evil.example/user/", "https://instagram.com/p/post/"]) assert.equal(instagramProfile(value), "");
});
