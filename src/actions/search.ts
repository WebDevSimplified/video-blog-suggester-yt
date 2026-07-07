"use server"

import { db } from "@/db/db"
import { chunks, content } from "@/db/schema"
import { eq, sql, gt, desc, cosineDistance } from "drizzle-orm"
import { embed } from "ai"
import { getEmbeddingModel } from "@/lib/embedding/get-embedding-model"
import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"

export async function searchContent(query: string) {
  const user = auth.api.getSession({ headers: await headers() })

  if (!user) return []

  if (!query.trim()) return []

  const model = getEmbeddingModel()
  const { embedding: queryVector } = await embed({
    model,
    value: query.trim().toLowerCase(),
  })

  const dbSimilarity = sql<number>`1 - (${cosineDistance(chunks.embedding, queryVector)})`

  const matchedChunks = await db
    .selectDistinctOn([content.id], {
      id: content.id,
      title: content.title,
      description: content.description,
      thumbnailUrl: content.thumbnailUrl,
      url: content.url,
      type: content.type,
      similarity: dbSimilarity,
      startPosition: chunks.startPosition,
      rawText: chunks.text,
    })
    .from(chunks)
    .where(gt(dbSimilarity, 0.5))
    .innerJoin(content, eq(content.id, chunks.contentId))
    .orderBy(content.id, desc(dbSimilarity))

  const sortedResults = matchedChunks.sort(
    (a, b) => b.similarity - a.similarity,
  )

  return sortedResults.slice(0, 20)
}
