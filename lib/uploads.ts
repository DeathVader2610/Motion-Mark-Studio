export function validateBrief(name: string, type: string, bytes: Buffer) {
  if (bytes.length > 3 * 1024 * 1024 || !bytes.length)
    throw new Error("Brief must be smaller than 3 MB.");
  const matches =
    (type === "application/pdf" &&
      /\.pdf$/i.test(name) &&
      bytes.subarray(0, 5).toString() === "%PDF-") ||
    (type === "image/png" &&
      /\.png$/i.test(name) &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (type === "image/jpeg" &&
      /\.jpe?g$/i.test(name) &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255);
  if (!matches) throw new Error("Upload a valid PDF, JPG or PNG.");
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}
export async function boundedForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 3.3 * 1024 * 1024) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  return new Request(request.url, {
    method: "POST",
    headers: { "content-type": request.headers.get("content-type") || "" },
    body: Buffer.concat(chunks),
  }).formData();
}
