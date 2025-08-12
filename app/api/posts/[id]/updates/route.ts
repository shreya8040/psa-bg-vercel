import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    const updates = await sql.query(
      `SELECT id, content, image_url, user_session, created_at 
       FROM post_updates 
       WHERE post_id = $1 
       ORDER BY created_at ASC`,
      [postId],
    )

    return NextResponse.json({ updates: updates.rows })
  } catch (error) {
    console.error("Error fetching post updates:", error)
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id
    const { content, image } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Update content is required" }, { status: 400 })
    }

    // Generate a simple user session ID
    const userSession = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const result = await sql.query(
      `INSERT INTO post_updates (post_id, content, image_url, user_session) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, content, image_url, user_session, created_at`,
      [postId, content.trim(), image || null, userSession],
    )

    return NextResponse.json({ update: result.rows[0] })
  } catch (error) {
    console.error("Error creating post update:", error)
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 })
  }
}
