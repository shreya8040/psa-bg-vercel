import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!, {
  // Suppress browser warning since we only use this on server-side
  disableWarningInBrowsers: true,
})
