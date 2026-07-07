import { createAuthClient } from "better-auth/react"

export const { useSession, signIn, signOut } = createAuthClient()
