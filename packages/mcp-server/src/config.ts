import { z } from "zod";

const CONTEXTOR_API_URL = "https://benevolent-llama-583.convex.site";

const envSchema = z.object({
  CONTEXTOR_PAT: z.string().min(1, "CONTEXTOR_PAT must be a non-empty personal access token"),
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

  const { CONTEXTOR_PAT, DEBUG } = result.data;

  return {
    apiUrl: CONTEXTOR_API_URL,
    token: CONTEXTOR_PAT,
    debug: DEBUG ?? false,
  };
}
