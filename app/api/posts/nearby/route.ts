import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db" // Use centralized database client

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = Number.parseFloat(searchParams.get("lat") || "0")
    const lng = Number.parseFloat(searchParams.get("lng") || "0")
    const radius = Number.parseFloat(searchParams.get("radius") || "5") // Default 5km

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 })
    }

    // Use Haversine formula to find posts within radius
    // This is a simplified version - for production, consider using PostGIS
    const posts = await sql`
      SELECT 
        p.id,
        p.content,
        p.location_description,
        p.location_lat,
        p.location_lng,
        p.created_at,
        COALESCE(
          array_agg(h.name) FILTER (WHERE h.name IS NOT NULL),
          '{}'::text[]
        ) as hashtags,
        (
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(p.location_lat)) * 
            cos(radians(p.location_lng) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(p.location_lat))
          )
        ) AS distance
      FROM posts p
      LEFT JOIN post_hashtags ph ON p.id = ph.post_id
      LEFT JOIN hashtags h ON ph.hashtag_id = h.id
      WHERE p.location_lat IS NOT NULL 
        AND p.location_lng IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(p.location_lat)) * 
            cos(radians(p.location_lng) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(p.location_lat))
          )
        ) <= ${radius}
      GROUP BY p.id, p.content, p.location_description, p.location_lat, p.location_lng, p.created_at
      ORDER BY distance ASC, p.created_at DESC
      LIMIT 50
    `

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching nearby posts:", error)
    return NextResponse.json({ error: "Failed to fetch nearby posts" }, { status: 500 })
  }
}
