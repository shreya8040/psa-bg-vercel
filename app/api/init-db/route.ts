import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
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

    return Response.json({ success: true, message: "Database initialized successfully" })
  } catch (error) {
    console.error("Database initialization error:", error)
    return Response.json({ success: false, error: "Failed to initialize database" }, { status: 500 })
  }
}
