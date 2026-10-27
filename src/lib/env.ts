import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  MAX_STAY_NIGHTS: z.coerce.number().int().positive().default(30),
  HOST_LISTING_EDITS_ENABLED: z.enum(["true", "false"]).default("true"),
});

let cached: z.infer<typeof schema> | undefined;
/** Server-only. Validated lazily so builds don't need runtime secrets. */
export function env() {
  return (cached ??= schema.parse(process.env));
}
