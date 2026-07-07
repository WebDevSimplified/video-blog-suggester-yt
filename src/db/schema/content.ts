import { text, date, pgEnum, snakeCase } from "drizzle-orm/pg-core"
import { id, timestamps } from "../utils"

export const contentTypeEnum = pgEnum("content_type", ["video", "article"])

export const content = snakeCase.table("content", {
  id,
  title: text().notNull(),
  description: text().notNull(),
  publishDate: date({ mode: "date" }).notNull(),
  url: text().notNull().unique(),
  thumbnailUrl: text().notNull(),
  type: contentTypeEnum().notNull(),
  content: text().notNull(),
  ...timestamps,
})
