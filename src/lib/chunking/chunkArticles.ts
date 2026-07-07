import * as cheerio from "cheerio"

export function chunkArticles(html: string): string[] {
  const result: string[] = []

  const $ = cheerio.load(html, null, false)
  const $main = $.root()

  let currentChunk = ""

  $main.children().each((_, el) => {
    const text = $(el).text().trim()
    if (el.name === "h2") {
      if (currentChunk.trim()) {
        result.push(currentChunk.trim())
      }
      currentChunk = ""
    }

    if (text) {
      currentChunk += `${text}\n\n`
    }
  })

  if (currentChunk.trim()) {
    result.push(currentChunk.trim())
  }

  return result
}
