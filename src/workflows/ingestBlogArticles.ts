import Parser from "rss-parser"
import * as cheerio from "cheerio"
import { db } from "@/db/db"
import { content } from "@/db/schema/content"
import { chunks } from "@/db/schema/chunks"
import { batchExec } from "./utils/batchExec"
import z from "zod"
import { FatalError } from "workflow"
import { chunkArticles } from "@/lib/chunking/chunkArticles"
import { embedChunks } from "@/lib/embedding/embed-chunks"

const RSS_URL = "https://blog.webdevsimplified.com/rss.xml"

const feedItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.url(),
  pubDate: z.coerce.date(),
})

export async function ingestBlogArticlesWorkflow() {
  "use workflow"

  const newArticles = await getNewArticlesFromRssFeed()
  return await batchExec(newArticles, ingestArticleStep)
}

async function getNewArticlesFromRssFeed() {
  "use step"

  const parser = new Parser({ customFields: { item: ["description"] } })
  const { items } = await parser.parseURL(RSS_URL)

  const existingUrls = await db.query.content
    .findMany({
      where: { type: "article" },
      columns: { url: true },
    })
    .then(data => data.map(r => r.url))

  return items.filter(item => item.link && !existingUrls.includes(item.link))
}

async function ingestArticleStep(feedItem: Parser.Item) {
  "use step"

  const { error, data: item } = feedItemSchema.safeParse(feedItem)
  if (error) {
    throw new FatalError(
      `Failed to process RSS feed item ${feedItem.link} -  ${error.message}`,
    )
  }

  const response = await fetch(item.link)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${item.link}: ${response.status}`)
  }
  const html = await response.text()

  const $ = cheerio.load(html)

  const mainHtml = $("article main").html()
  const thumbnailUrl =
    $('meta[property="og:image"]').attr("content") ??
    $('meta[name="twitter:image"]').attr("content")

  if (mainHtml == null || thumbnailUrl == null) {
    throw new FatalError(`Failed to load HTML ${item.link}`)
  }

  const chunkTexts = chunkArticles(mainHtml)
  const embeddings = await embedChunks(chunkTexts)

  const [contentRow] = await db
    .insert(content)
    .values({
      type: "article",
      title: item.title,
      description: item.description,
      publishDate: item.pubDate,
      url: item.link,
      thumbnailUrl,
      content: mainHtml,
    })
    .onConflictDoNothing()
    .returning({ id: content.id })

  if (contentRow?.id == null) {
    throw new FatalError(
      `Duplicate detected and failed to insert - ${item.link}`,
    )
  }

  if (chunkTexts.length > 0) {
    await db.insert(chunks).values(
      chunkTexts.map((chunkText, i) => ({
        contentId: contentRow.id,
        startPosition: null,
        embedding: embeddings[i],
        text: chunkText,
      })),
    )
  }
}
