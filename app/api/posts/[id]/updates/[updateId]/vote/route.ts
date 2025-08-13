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

export async function POST(request: NextRequest, { params }: { params: { id: string; updateId: string } }) {
  try {
    await ensureVotesTableExists()

    const { voteType } = await request.json()
    const updateId = Number.parseInt(params.updateId)

    if (!voteType || !["upvote", "downvote"].includes(voteType)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 })
    }

    const userSession = request.headers.get("X-User-Session")

    if (!userSession) {
      return NextResponse.json({ error: "User session required" }, { status: 400 })
    }

    const existingVote = await sql`
      SELECT vote_type FROM update_votes 
      WHERE update_id = ${updateId} AND user_session = ${userSession}
    `

    if (existingVote.length > 0) {
      const currentVoteType = existingVote[0].vote_type

      if (currentVoteType === voteType) {
        await sql`
          DELETE FROM update_votes 
          WHERE update_id = ${updateId} AND user_session = ${userSession}
        `
      } else {
        await sql`
          UPDATE update_votes 
          SET vote_type = ${voteType}, created_at = NOW()
          WHERE update_id = ${updateId} AND user_session = ${userSession}
        `
      }
    } else {
      await sql`
        INSERT INTO update_votes (update_id, user_session, vote_type)
        VALUES (${updateId}, ${userSession}, ${voteType})
      `
    }

    const voteCounts = await sql`
      SELECT 
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
      FROM update_votes 
      WHERE update_id = ${updateId}
    `

    const userVoteResult = await sql`
      SELECT vote_type FROM update_votes 
      WHERE update_id = ${updateId} AND user_session = ${userSession}
    `

    const responseData = {
      success: true,
      upvotes: Number(voteCounts[0].upvotes),
      downvotes: Number(voteCounts[0].downvotes),
      userVote: userVoteResult.length > 0 ? userVoteResult[0].vote_type : null,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error voting on update:", error)
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}
