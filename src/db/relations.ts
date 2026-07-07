import { defineRelations } from "drizzle-orm"
import * as schema from "./schema"

export const relations = defineRelations(schema, r => ({
  content: {
    chunks: r.many.chunks({
      from: r.content.id,
      to: r.chunks.contentId,
    }),
  },
  chunks: {
    content: r.one.content({
      from: r.chunks.contentId,
      to: r.content.id,
    }),
  },
}))
