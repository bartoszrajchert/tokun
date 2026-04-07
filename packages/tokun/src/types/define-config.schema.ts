import * as z from "zod/mini";

export const ConfigSchema = z.strictObject({
  data: z.union([
    z.string(),
    z.array(z.string()),
    z.looseObject({}),
    z.array(z.union([z.string(), z.looseObject({})])),
  ]),
  log: z.optional(
    z.looseObject({
      verbosity: z.optional(z.enum(["default", "silent", "verbose"])),
      warnings: z.optional(z.enum(["warn", "error", "disabled"])),
    }),
  ),
  options: z.optional(
    z.looseObject({
      loader: z.union([z.string(), z.looseObject({})]),
      platforms: z.array(z.looseObject({})),
    }),
  ),
});
