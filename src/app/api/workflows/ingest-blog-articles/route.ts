import { ingestBlogArticlesWorkflow } from "@/workflows/ingestBlogArticles"
import { NextRequest } from "next/server"
import { verifyAndRunCron } from "@/workflows/utils/verifyAndRunCron"

export async function GET(request: NextRequest) {
  return await verifyAndRunCron(request, ingestBlogArticlesWorkflow)
}
