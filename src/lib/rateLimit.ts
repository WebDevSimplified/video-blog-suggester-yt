import { db } from "@/db/db"
import { userSearches } from "@/db/schema"
import { serverEnv } from "@/data/serverEnv"
import { eq, and, gt, count } from "drizzle-orm"

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RateLimitError"
  }
}

export async function checkRateLimit(userId: string): Promise<void> {
  const maxRequests = serverEnv.RATE_LIMIT_MAX_REQUESTS
  const windowHours = serverEnv.RATE_LIMIT_WINDOW_HOURS
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000)

  const [{ count: recentCount }] = await db
    .select({ count: count() })
    .from(userSearches)
    .where(
      and(
        eq(userSearches.userId, userId),
        gt(userSearches.createdAt, windowStart),
      ),
    )

  if (recentCount >= maxRequests) {
    throw new RateLimitError(
      `Rate limit exceeded: you can only make ${maxRequests} searches per ${windowHours} hour${windowHours !== 1 ? "s" : ""}. Please try again later.`,
    )
  }
}
