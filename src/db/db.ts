import { serverEnv } from "@/data/serverEnv"
import { drizzle } from "drizzle-orm/neon-http"
import { relations } from "./relations"
import { authRelations } from "./schema/auth"

export const db = drizzle(serverEnv.DATABASE_URL, {
  relations: { ...relations, ...authRelations },
})
