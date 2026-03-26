import { z } from "zod";

const envSchema = z.object({
  LANGFUSE_HOST: z.string().url().default("https://cloud.langfuse.com"),
  LANGFUSE_PUBLIC_KEY: z.string().default(""),
  LANGFUSE_SECRET_KEY: z.string().default(""),
  LANGFUSE_MOCK: z
    .string()
    .transform((v) => v === "true" || v === "1")
    .default("false"),
  API_PORT: z.coerce.number().default(3001),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(`Missing or invalid env vars: ${missing}`);
  }

  const config = result.data;

  if (!config.LANGFUSE_MOCK && (!config.LANGFUSE_PUBLIC_KEY || !config.LANGFUSE_SECRET_KEY)) {
    throw new Error(
      "LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are required when not in mock mode. Set LANGFUSE_MOCK=true for demo data.",
    );
  }

  return config;
}
