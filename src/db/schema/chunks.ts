import {
  integer,
  text,
  uuid,
  vector,
  snakeCase,
  index,
} from "drizzle-orm/pg-core"
import { id, timestamps } from "../utils"
import { content } from "./content"

export const chunks = snakeCase.table(
  "chunks",
  {
    id,
    contentId: uuid()
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    startPosition: integer(),
    embedding: vector({ dimensions: 1536 }).notNull(),
    text: text().notNull(),
    ...timestamps,
  },
  table => [
    index("embedding_index").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
)
