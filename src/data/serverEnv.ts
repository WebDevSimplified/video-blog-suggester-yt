import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.url(),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
