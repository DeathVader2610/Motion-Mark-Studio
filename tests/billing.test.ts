import test from "node:test";
import assert from "node:assert/strict";
import {
  minor,
  totals,
  invoiceState,
  dateSchema,
  clientSchema,
} from "../lib/billing";
test("money input preserves paise and rejects exponent, negative and excess precision", () => {
  assert.equal(minor("0.29"), 29);
  assert.equal(minor("100.10"), 10010);
  for (const v of ["-1", "1.999", "1e3", "NaN", "Infinity", "10000001"])
    assert.throws(() => minor(v));
});
test("invoice totals are exact and discount cannot zero or exceed the invoice", () => {
  const items = [
    { description: "Shoot", quantity: 3, rate: 10010 },
    { description: "Edit", quantity: 1, rate: 5000 },
  ];
  assert.deepEqual(totals(items, 1000), {
    subtotal: 35030,
    discount: 1000,
    total: 34030,
  });
  assert.throws(() => totals(items, 35030));
  assert.throws(() => totals(items, -1));
  assert.throws(() =>
    totals([{ description: "Xx", quantity: 10000, rate: 1000000000 }], 0),
  );
});
test("invoice lines reject fractional quantities, negative rates and empty rows", () => {
  assert.throws(() => totals([], 0));
  assert.throws(() =>
    totals([{ description: "Edit", quantity: 1.5, rate: 500 }], 0),
  );
  assert.throws(() =>
    totals([{ description: "Edit", quantity: 1, rate: -500 }], 0),
  );
});
test("paid and void states take precedence over overdue dates", () => {
  const i = {
    status: "issued" as const,
    total: 10000,
    paid: 10000,
    due_on: "2000-01-01",
  };
  assert.equal(invoiceState(i), "paid");
  assert.equal(invoiceState({ ...i, status: "void" }), "void");
  assert.equal(invoiceState({ ...i, paid: 500 }), "overdue");
  assert.equal(
    invoiceState({ ...i, paid: 500, due_on: "2099-01-01" }),
    "partial",
  );
});
test("dates reject impossible calendar dates", () => {
  assert.equal(dateSchema.safeParse("2026-02-30").success, false);
  assert.equal(dateSchema.safeParse("2028-02-29").success, true);
});
test("client inputs reject script photo URLs and arbitrary Instagram links", () => {
  const client = {
    name: "Example",
    company: "",
    email: "qa@example.com",
    phone: "",
    address: "",
    instagram: "studio.example",
    bio: "",
    photo: "",
    notes: "",
    active: true,
  };
  assert.equal(clientSchema.safeParse(client).success, true);
  assert.equal(
    clientSchema.safeParse({ ...client, photo: "javascript:alert(1)" }).success,
    false,
  );
  assert.equal(
    clientSchema.safeParse({ ...client, instagram: "https://evil.example" })
      .success,
    false,
  );
});
