import { NextResponse } from "next/server"
import { sql } from "@/lib/db" // Use centralized database client

export async function GET() {
  try {
    const popularHashtags = await sql`
      SELECT 
        h.name,
        COUNT(ph.post_id) as count
      FROM hashtags h
      JOIN post_hashtags ph ON h.id = ph.hashtag_id
      JOIN posts p ON ph.post_id = p.id
      WHERE p.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY h.id, h.name
      HAVING COUNT(ph.post_id) > 0
      ORDER BY count DESC, h.name ASC
      LIMIT 20
    `

    return NextResponse.json(popularHashtags)
  } catch (error) {
    console.error("Error fetching popular hashtags:", error)
    return NextResponse.json({ error: "Failed to fetch popular hashtags" }, { status: 500 })
  }
}
