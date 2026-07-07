import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    LOCAL_EMBEDDING_BASE_URL: z.url().optional(),
    EMBEDDING_PROVIDER: z.enum(["qwen", "openai"]),
    OPENAI_API_KEY: z.string(),
    CRON_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REFRESH_TOKEN: z.string(),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
