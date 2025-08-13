import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import crypto from "crypto"

let dbInitialized = false

async function initializeDatabase() {
  if (dbInitialized) return

  try {
    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        // Create posts table
        await sql`
          CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            image_url TEXT,
            location_lat DECIMAL(10, 8),
            location_lng DECIMAL(11, 8),
            location_description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_session TEXT
          )
        `

        // Create hashtags table
        await sql`
          CREATE TABLE IF NOT EXISTS hashtags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `

        // Create post_hashtags junction table
        await sql`
          CREATE TABLE IF NOT EXISTS post_hashtags (
            post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
            hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
            PRIMARY KEY (post_id, hashtag_id)
          )
        `

        // Create indexes for performance
        await sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`
        await sql`CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location_lat, location_lng)`
        await sql`CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name)`

        // Seed common Bangalore hashtags
        const bangaloreAreas = [
          "koramangala",
          "indiranagar",
          "whitefield",
          "electronic-city",
          "btm-layout",
          "jayanagar",
          "malleshwaram",
          "rajajinagar",
          "hebbal",
          "marathahalli",
          "silk-board",
          "mg-road",
          "brigade-road",
          "commercial-street",
          "ulsoor",
          "sadashivanagar",
          "rt-nagar",
          "banaswadi",
          "kalyan-nagar",
          "yelahanka",
          "jp-nagar",
          "bannerghatta-road",
          "hosur-road",
          "sarjapur-road",
          "outer-ring-road",
        ]

        for (const area of bangaloreAreas) {
          await sql`
            INSERT INTO hashtags (name) 
            VALUES (${area}) 
            ON CONFLICT (name) DO NOTHING
          `
        }

        dbInitialized = true
        break // Success, exit retry loop
      } catch (retryError: any) {
        retryCount++
        console.error(`Database initialization attempt ${retryCount} failed:`, retryError?.message || retryError)

        if (retryCount >= maxRetries) {
          throw new Error(
            `Database initialization failed after ${maxRetries} attempts: ${retryError?.message || "Unknown error"}`,
          )
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }
  } catch (error: any) {
    console.error("Database initialization error:", error?.message || error)
    throw new Error(`Database initialization failed: ${error?.message || "Connection error"}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, hashtags, location, image } = await request.json()

    try {
      await initializeDatabase()
    } catch (initError: any) {
      console.error("Failed to initialize database:", initError?.message)
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    // Insert the post
    const [post] = await sql`
      INSERT INTO posts (content, location_lat, location_lng, location_description, user_session, image_url)
      VALUES (${content}, ${location?.lat || null}, ${location?.lng || null}, ${location?.description || null}, ${crypto.randomUUID()}, ${image || null})
      RETURNING id, created_at
    `

    // Handle hashtags
    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        const cleanTag = tag.replace("#", "").toLowerCase()

        // Insert hashtag if it doesn't exist
        await sql`
          INSERT INTO hashtags (name) VALUES (${cleanTag})
          ON CONFLICT (name) DO NOTHING
        `

        // Get hashtag id and link to post
        const [hashtag] = await sql`
          SELECT id FROM hashtags WHERE name = ${cleanTag}
        `

        if (hashtag) {
          await sql`
            INSERT INTO post_hashtags (post_id, hashtag_id)
            VALUES (${post.id}, ${hashtag.id})
            ON CONFLICT (post_id, hashtag_id) DO NOTHING
          `
        }
      }
    }

    return NextResponse.json({ success: true, id: post.id })
  } catch (error: any) {
    console.error("Error creating post:", error?.message || error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    let posts = []

    try {
      // Quick check if posts table exists
      await sql`SELECT 1 FROM posts LIMIT 1`
    } catch (error: any) {
      // Table doesn't exist, initialize database
      try {
        await initializeDatabase()
      } catch (initError: any) {
        console.error("Failed to initialize database:", initError?.message)
        return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
      }
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    try {
      posts = await sql`
        SELECT 
          p.id,
          p.content,
          p.location_description,
          p.location_lat,
          p.location_lng,
          p.created_at,
          p.image_url
        FROM posts p
        ORDER BY p.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } catch (dbError: any) {
      console.error("Database query error:", dbError?.message || dbError)
      return NextResponse.json({ error: "Database query failed" }, { status: 503 })
    }

    const postsWithHashtags = await Promise.all(
      posts.map(async (post) => {
        try {
          const hashtags = await sql`
            SELECT h.name
            FROM hashtags h
            JOIN post_hashtags ph ON h.id = ph.hashtag_id
            WHERE ph.post_id = ${post.id}
          `
          return {
            ...post,
            hashtags: hashtags.map((h: any) => h.name),
          }
        } catch (hashtagError: any) {
          console.error("Error fetching hashtags for post:", post.id, hashtagError?.message)
          return {
            ...post,
            hashtags: [],
          }
        }
      }),
    )

    return NextResponse.json(postsWithHashtags)
  } catch (error: any) {
    console.error("Error fetching posts:", error?.message || error)
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
  }
}
