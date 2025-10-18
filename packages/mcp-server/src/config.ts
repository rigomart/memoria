import { z } from "zod";

const envSchema = z.object({
  MEMORIA_API_URL: z
    .string()
    .url("MEMORIA_API_URL must be a valid URL (e.g. https://example.convex.cloud)"),
  MEMORIA_PAT: z.string().min(1, "MEMORIA_PAT must be a non-empty personal access token"),
  DEBUG: z
    .union([z.literal("1"), z.literal("0"), z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => (value ? value === "1" || value.toLowerCase() === "true" : false)),
});

export type AppConfig = {
  apiUrl: string;
  token: string;
  debug: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join("\n");
    throw new Error(`Invalid environment configuration:\n${message}`);
  }

  const { MEMORIA_API_URL, MEMORIA_PAT, DEBUG } = result.data;

  return {
    apiUrl: stripTrailingSlash(MEMORIA_API_URL),
    token: MEMORIA_PAT,
    debug: DEBUG ?? false,
  };
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
