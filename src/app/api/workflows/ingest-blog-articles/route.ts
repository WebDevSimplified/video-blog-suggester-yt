import { start } from "workflow/api"
import { ingestBlogArticlesWorkflow } from "@/workflows/ingestBlogArticles"
import { NextResponse } from "next/server"

export async function POST() {
  const run = await start(ingestBlogArticlesWorkflow)

  return NextResponse.json({
    message: "Blog article ingestion workflow started",
    runId: run.runId,
  })
}
