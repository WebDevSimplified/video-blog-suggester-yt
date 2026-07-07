import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
