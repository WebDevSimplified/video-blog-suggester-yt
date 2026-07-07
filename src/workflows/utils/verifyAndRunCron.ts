import { serverEnv } from "@/data/serverEnv"
import { NextRequest } from "next/server"
import { start } from "workflow/api"

export async function verifyAndRunCron(
  request: NextRequest,
  runCron: () => Promise<unknown>,
) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = serverEnv.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const run = await start(runCron)

  return Response.json({ message: "Cron started", runId: run.runId })
}
