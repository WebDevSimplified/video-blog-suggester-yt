import { NextRequest } from "next/server"
import { ingestYouTubeVideosWorkflow } from "@/workflows/ingestYouTubeVideos"
import { verifyAndRunCron } from "@/workflows/utils/verifyAndRunCron"

export async function GET(request: NextRequest) {
  return await verifyAndRunCron(request, ingestYouTubeVideosWorkflow)
}
