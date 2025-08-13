import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function ensureVotesTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS update_votes (
        id SERIAL PRIMARY KEY,
        update_id INTEGER NOT NULL,
        user_session TEXT NOT NULL,
        vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(update_id, user_session)
      )
    `
  } catch (error) {
    console.error("Error creating update_votes table:", error)
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string; updateId: string } }) {
  try {
    await ensureVotesTableExists()

    const updateId = Number.parseInt(params.updateId)

    const userSession = request.headers.get("X-User-Session")

    if (!userSession) {
      return NextResponse.json({ error: "User session required" }, { status: 400 })
    }

    const userVote = await sql`
      SELECT vote_type FROM update_votes 
      WHERE update_id = ${updateId} AND user_session = ${userSession}
    `

    const voteCounts = await sql`
      SELECT 
        vote_type,
        COUNT(*) as count
      FROM update_votes 
      WHERE update_id = ${updateId}
      GROUP BY vote_type
    `

    const userVoteType = userVote.length > 0 ? userVote[0].vote_type : null

    const upvotes = voteCounts.find((v) => v.vote_type === "upvote")?.count || 0
    const downvotes = voteCounts.find((v) => v.vote_type === "downvote")?.count || 0

    return NextResponse.json({
      userVote: userVoteType,
      upvotes: Number(upvotes),
      downvotes: Number(downvotes),
    })
  } catch (error) {
    console.error("Error fetching votes:", error)
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 })
  }
}
