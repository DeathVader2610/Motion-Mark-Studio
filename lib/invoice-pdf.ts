import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { invoiceLogo } from "./invoice-logo";
import { amountInput, type Invoice } from "./billing";
export async function invoicePdf(i: Invoice): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`${i.number || "Draft invoice"} - Motion Mark Studio`);
  pdf.setAuthor(i.studio_snapshot.name);
  const font = await pdf.embedFont(
    await readFile(path.join(process.cwd(), "public/fonts/NotoSans.ttf")),
    { subset: true },
  );
  const logo = await pdf.embedPng(invoiceLogo);
  const ink = rgb(0.1, 0.12, 0.11),
    muted = rgb(0.4, 0.43, 0.4),
    line = rgb(0.84, 0.85, 0.82),
    paper = rgb(0.95, 0.95, 0.92);
  let page: PDFPage;
  let y = 0;
  const left = 44,
    right = 551;
  const clean = (s: string) =>
    s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const text = (s: string, x: number, at: number, size = 10, color = ink) =>
    page.drawText(clean(s), { x, y: at, size, font, color });
  function wrap(value: string, width: number, size = 10) {
    const lines: string[] = [];
    for (const para of clean(value).split("\n")) {
      let row = "";
      for (const word of para.split(/\s+/)) {
        const candidate = row ? row + " " + word : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) {
          row = candidate;
          continue;
        }
        if (row) lines.push(row);
        row = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(row + char, size) > width && row) {
            lines.push(row);
            row = "";
          }
          row += char;
        }
      }
      lines.push(row);
    }
    return lines;
  }
  const rule = (at: number) =>
    page.drawLine({
      start: { x: left, y: at },
      end: { x: right, y: at },
      thickness: 0.6,
      color: line,
    });
  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    page.drawImage(logo, { x: left, y: 771, width: 49, height: 25.5 });
    text("MOTION MARK STUDIO", 106, 786, 12);
    text("Stories in motion. Brands that leave a mark.", 106, 770, 8, muted);
    text(
      i.status === "draft"
        ? "DRAFT / NOT ISSUED"
        : i.status === "void"
          ? "VOID INVOICE"
          : "INVOICE",
      right -
        font.widthOfTextAtSize(
          i.status === "draft"
            ? "DRAFT / NOT ISSUED"
            : i.status === "void"
              ? "VOID INVOICE"
              : "INVOICE",
          10,
        ),
      785,
      10,
      muted,
    );
    text(
      "INR · No tax charged",
      right - font.widthOfTextAtSize("INR · No tax charged", 8),
      770,
      8,
      muted,
    );
    rule(750);
    y = 727;
  }
  const ensure = (h: number) => {
    if (y - h < 72) newPage();
  };
  function block(value: string, width = 507, size = 10, x = left) {
    for (const row of wrap(value, width, size)) {
      ensure(size + 6);
      text(row, x, y, size);
      y -= size + 6;
    }
  }
  function heading(s: string) {
    ensure(40);
    y -= 14;
    text(s, left, y, 9, muted);
    y -= 21;
  }
  const amount = (n: number) =>
    "INR " +
    Number(amountInput(n)).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  function rightText(s: string, at: number, size = 10) {
    text(s, right - font.widthOfTextAtSize(s, size), at, size);
  }
  newPage();
  block(i.number || "Draft invoice", 507, 25);
  block(i.title, 507, 12);
  y -= 12;
  const top = y;
  const studioLines = [
    i.studio_snapshot.name,
    i.studio_snapshot.address,
    i.studio_snapshot.email,
    i.studio_snapshot.phone,
  ]
    .filter(Boolean)
    .join("\n");
  text("FROM", left, y, 8, muted);
  y -= 18;
  block(studioLines, 234, 9);
  const studioBottom = y;
  y = top;
  text("BILL TO", 314, y, 8, muted);
  y -= 18;
  block(
    [
      i.client_snapshot.company,
      i.client_snapshot.name,
      i.client_snapshot.address,
      i.client_snapshot.email,
      i.client_snapshot.phone,
    ]
      .filter(Boolean)
      .join("\n"),
    237,
    9,
    314,
  );
  y = Math.min(y, studioBottom) - 14;
  ensure(65);
  rule(y);
  y -= 22;
  text(`Invoice date  ${i.issued_on}`, left, y, 9);
  text(`Due date  ${i.due_on}`, 314, y, 9);
  y -= 22;
  rule(y);
  y -= 28;
  function tableHead() {
    ensure(40);
    page.drawRectangle({
      x: left,
      y: y - 10,
      width: right - left,
      height: 28,
      color: paper,
    });
    text("DESCRIPTION", left + 10, y, 8, muted);
    text("QTY", 350, y, 8, muted);
    text("RATE (INR)", 397, y, 8, muted);
    text("AMOUNT (INR)", 475, y, 8, muted);
    y -= 32;
  }
  tableHead();
  for (const item of i.items) {
    const rows = wrap(item.description, 287, 9);
    const h = rows.length * 14 + 16;
    if (y - h < 72) {
      newPage();
      tableHead();
    }
    rows.forEach((row, index) => text(row, left + 10, y - index * 14, 9));
    text(String(item.quantity), 350, y, 9);
    const rate = amountInput(item.rate),
      sum = amountInput(item.rate * item.quantity);
    text(rate, 453 - font.widthOfTextAtSize(rate, 9), y, 9);
    rightText(sum, y, 9);
    y -= h;
    rule(y + 7);
  }
  ensure(142);
  y -= 16;
  const totalRow = (label: string, value: string, big = false) => {
    text(label, 315, y, big ? 12 : 10, big ? ink : muted);
    rightText(value, y, big ? 12 : 10);
    y -= big ? 28 : 23;
  };
  totalRow("Subtotal", amount(i.subtotal));
  if (i.discount) totalRow("Discount", "- " + amount(i.discount));
  totalRow("Total", amount(i.total), true);
  totalRow("Payments recorded", amount(i.paid));
  totalRow(
    "Balance due",
    amount(i.status === "void" ? 0 : i.total - i.paid),
    true,
  );
  if (i.status === "void") {
    heading("VOID REASON");
    block(i.void_reason);
  }
  if (i.studio_snapshot.paymentInstructions) {
    heading("PAYMENT DETAILS");
    block(i.studio_snapshot.paymentInstructions, 507, 9);
  }
  if (i.notes) {
    heading("NOTES");
    block(i.notes, 507, 9);
  }
  if (i.terms) {
    heading("TERMS");
    block(i.terms, 507, 9);
  }
  if (y > 104) {
    y -= 12;
    block("Thank you for creating with us. No tax has been charged.", 507, 8);
  }
  pdf.getPages().forEach((p, index) => {
    page = p;
    rule(49);
    text(i.number || "DRAFT", left, 33, 8, muted);
    rightText(`Page ${index + 1} of ${pdf.getPageCount()}`, 33, 8);
  });
  return pdf.save();
}
