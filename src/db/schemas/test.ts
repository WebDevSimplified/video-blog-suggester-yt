import { integer, snakeCase, varchar } from "drizzle-orm/pg-core"

export const testsTable = snakeCase.table("tests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
})
