import { timestamp, uuid } from "drizzle-orm/pg-core"

export const id = uuid().defaultRandom().primaryKey()

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}
