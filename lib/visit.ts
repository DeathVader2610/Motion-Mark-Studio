import { z } from "zod";
export const publicPath = (p: string) =>
  /^\/(?:|services|work(?:\/[a-z0-9-]+)?|about|founders|collaborations|instagram|videos|contact|privacy|terms)$/.test(
    p,
  );
export const visitSchema = z.object({
  event: z.string().uuid(),
  visitor: z.string().uuid(),
  path: z.string().max(160).refine(publicPath),
});
