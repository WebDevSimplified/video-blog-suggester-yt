import { text, uuid, snakeCase, index } from "drizzle-orm/pg-core"
import { id, timestamps } from "../utils"
import { user } from "./auth"

export const userSearches = snakeCase.table(
  "user_searches",
  {
    id,
    queryText: text().notNull(),
    userId: uuid()
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    resultContentIds: text().notNull().array(),
    createdAt: timestamps.createdAt,
  },
  table => [
    index("user_searches_userId_createdAt_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
)
