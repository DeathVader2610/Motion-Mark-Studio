import "server-only";
import { getContent } from "./data";

/** Curated entries only; no Instagram API credentials or network requests. */
export async function getInstagram() {
  return { items: await getContent("instagram") };
}
