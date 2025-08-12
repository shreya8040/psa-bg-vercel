import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const hashtags = searchParams.get("hashtags")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    const whereConditions = []
    const params: any[] = []

    // Text search in content
    if (query) {
      whereConditions.push(`p.content ILIKE $1`)
      params.push(`%${query}%`)
    }

    // Hashtag filter
    if (hashtags) {
      const hashtagList = hashtags.split(",").map((tag) => tag.trim())
      whereConditions.push(`h.name = ANY($${params.length + 1})`)
      params.push(hashtagList)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Base query
    let searchQuery = `
      SELECT 
        p.id,
        p.content,
        p.image_url,
        p.location_description,
        p.location_lat,
        p.location_lng,
        p.created_at,
        COALESCE(
          array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL),
          '{}'::text[]
        ) as hashtags
    `

    // Add distance calculation if location provided
    if (lat && lng) {
      const userLat = Number.parseFloat(lat)
      const userLng = Number.parseFloat(lng)
      searchQuery += `,
        CASE 
          WHEN p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL THEN
            (
              6371 * acos(
                cos(radians($${params.length + 1})) * 
                cos(radians(p.location_lat)) * 
                cos(radians(p.location_lng) - radians($${params.length + 2})) + 
                sin(radians($${params.length + 1})) * 
                sin(radians(p.location_lat))
              )
            )
          ELSE NULL
        END AS distance
      `
      params.push(userLat, userLng)
    }

    searchQuery += `
      FROM posts p
      LEFT JOIN post_hashtags ph ON p.id = ph.post_id
      LEFT JOIN hashtags h ON ph.hashtag_id = h.id
      ${whereClause}
      GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
    `

    // Order by distance if location provided, otherwise by recency
    if (lat && lng) {
      searchQuery += ` ORDER BY distance ASC NULLS LAST, p.created_at DESC`
    } else {
      searchQuery += ` ORDER BY p.created_at DESC`
    }

    searchQuery += ` LIMIT 50`

    const results = await sql.query(searchQuery, params)

    return NextResponse.json(results.rows)
  } catch (error) {
    console.error("Error searching posts:", error)
    return NextResponse.json({ error: "Failed to search posts" }, { status: 500 })
  }
}
