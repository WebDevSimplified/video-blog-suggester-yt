import { google, youtube_v3 } from "googleapis"
import { parseSync } from "subtitle"
import { db } from "@/db/db"
import { content } from "@/db/schema/content"
import { chunks } from "@/db/schema/chunks"
import { batchExec } from "./utils/batchExec"
import { serverEnv } from "@/data/serverEnv"
import { FatalError } from "workflow"
import { embedChunks } from "@/lib/embedding/embed-chunks"
import z from "zod"

const chunkSize = 15
const overlapSize = 3
const segmentStep = chunkSize - overlapSize

const videoItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  thumbnailUrl: z.url(),
})

export async function ingestYouTubeVideosWorkflow() {
  "use workflow"

  const newVideos = await getNewVideosFromPlaylist()
  return await batchExec(newVideos, ingestVideoStep, {
    batchSize: 10,
    delayMs: 9 * 60 * 60 * 1000, // 9 hours
  })
}

async function getNewVideosFromPlaylist() {
  "use step"

  const videoIds = await getPlaylistItems()

  const existingUrls = await db.query.content
    .findMany({
      where: { type: "video" },
      columns: { url: true },
    })
    .then(data => data.map(r => r.url))

  return videoIds.filter(
    id => !existingUrls.includes(`https://www.youtube.com/watch?v=${id}`),
  )
}

async function getPlaylistItems() {
  "use step"

  const oauth2Client = createOAuth2Client()
  const youtube = google.youtube({ version: "v3", auth: oauth2Client })

  const channelDetails = await youtube.channels.list({
    part: ["contentDetails"],
    mine: true,
  })

  const uploadsPlaylistId =
    channelDetails.data?.items?.[0].contentDetails?.relatedPlaylists?.uploads

  const allItems: youtube_v3.Schema$PlaylistItem[] = []
  let nextPageToken: string | undefined

  do {
    const response = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails", "status"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken: nextPageToken,
    })

    const items = response.data.items ?? []
    allItems.push(
      ...items.filter(item => item.status?.privacyStatus === "public"),
    )

    nextPageToken = response.data.nextPageToken ?? undefined
  } while (nextPageToken != null)

  return allItems
}

function createOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    serverEnv.GOOGLE_CLIENT_ID,
    serverEnv.GOOGLE_CLIENT_SECRET,
    "http://localhost",
  )
  oauth2Client.setCredentials({
    refresh_token: serverEnv.GOOGLE_REFRESH_TOKEN,
  })
  return oauth2Client
}

async function ingestVideoStep(video: youtube_v3.Schema$PlaylistItem) {
  "use step"

  const { error, data: videoItem } = videoItemSchema.safeParse({
    id: video.contentDetails?.videoId,
    title: video.snippet?.title,
    description: video.snippet?.description,
    publishedAt: video.snippet?.publishedAt,
    thumbnailUrl: video.snippet?.thumbnails?.high?.url,
  })

  if (error) {
    throw new FatalError(
      `Failed to process YouTube video ${video.id} - ${error.message}`,
    )
  }

  const oauth2Client = createOAuth2Client()
  const youtube = google.youtube({ version: "v3", auth: oauth2Client })

  const videoUrl = `https://www.youtube.com/watch?v=${videoItem.id}`

  // Fetch caption tracks
  const captionResponse = await youtube.captions.list({
    part: ["snippet"],
    videoId: videoItem.id,
  })

  const captionTracks = captionResponse.data.items ?? []

  // Download SRT captions (prefer English)
  const englishTrack = captionTracks.find(
    track => track.snippet?.language === "en",
  )
  const captionId = englishTrack?.id

  if (captionId == null) {
    throw new FatalError(`No captions available for ${videoUrl}`)
  }
  const downloadResponse = await youtube.captions.download(
    {
      id: captionId,
      tfmt: "srt",
    },
    { responseType: "text" },
  )

  const srtContent = downloadResponse.data as string

  // Parse SRT captions using the subtitle library
  const nodes = parseSync(srtContent)

  // Extract segments (cues) from parsed nodes
  const segments = nodes
    .filter(node => node.type === "cue")
    .map(node => ({
      text: node.data.text.trim(),
      startTime: node.data.start,
    }))
    .filter(seg => seg.text.length > 0)

  if (segments.length === 0) {
    throw new FatalError(`No valid caption segments for ${videoUrl}`)
  }

  // Create chunks with overlap
  const chunkTexts: string[] = []
  for (let i = 0; i < segments.length; i += segmentStep) {
    const end = Math.min(i + chunkSize, segments.length)
    if (end - i < 1) continue

    const chunkSegments = segments.slice(i, end)
    const chunkText = chunkSegments.map(seg => seg.text).join(" ")
    chunkTexts.push(chunkText)
  }

  // Embed chunks
  const embeddings = await embedChunks(chunkTexts)

  // Save content row
  const [contentRow] = await db
    .insert(content)
    .values({
      type: "video",
      title: videoItem.title,
      description: videoItem.description,
      publishDate: videoItem.publishedAt,
      url: videoUrl,
      thumbnailUrl: videoItem.thumbnailUrl,
      content: srtContent,
    })
    .onConflictDoNothing()
    .returning({ id: content.id })

  if (contentRow?.id == null) {
    throw new FatalError(
      `Duplicate detected and failed to insert - ${videoUrl}`,
    )
  }

  // Save chunks with startPosition (timestamp of first segment in each chunk)
  if (chunkTexts.length > 0) {
    await db.insert(chunks).values(
      chunkTexts.map((chunkText, i) => {
        const chunkStartIndex = i * segmentStep
        const startPosition = segments[chunkStartIndex]?.startTime ?? null
        return {
          contentId: contentRow.id,
          startPosition,
          embedding: embeddings[i],
          text: chunkText,
        }
      }),
    )
  }
}
