import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db" // Use centralized database client

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const hashtags = searchParams.get("hashtags")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    let searchResults

    if (query && hashtags) {
      // Search with both text and hashtags
      const hashtagList = hashtags.split(",").map((tag) => tag.trim())
      if (lat && lng) {
        const userLat = Number.parseFloat(lat)
        const userLng = Number.parseFloat(lng)
        searchResults = await sql`
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
            ) as hashtags,
            (
              6371 * acos(
                cos(radians(${userLat})) * 
                cos(radians(p.location_lat)) * 
                cos(radians(p.location_lng) - radians(${userLng})) + 
                sin(radians(${userLat})) * 
                sin(radians(p.location_lat))
              )
            ) AS distance
          FROM posts p
          LEFT JOIN post_hashtags ph ON p.id = ph.post_id
          LEFT JOIN hashtags h ON ph.hashtag_id = h.id
          WHERE p.content ILIKE ${`%${query}%`} AND h.name = ANY(${hashtagList})
          GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
          ORDER BY distance ASC NULLS LAST, p.created_at DESC
          LIMIT 50
        `
      } else {
        searchResults = await sql`
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
          FROM posts p
          LEFT JOIN post_hashtags ph ON p.id = ph.post_id
          LEFT JOIN hashtags h ON ph.hashtag_id = h.id
          WHERE p.content ILIKE ${`%${query}%`} AND h.name = ANY(${hashtagList})
          GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
          ORDER BY p.created_at DESC
          LIMIT 50
        `
      }
    } else if (query) {
      // Text search only
      if (lat && lng) {
        const userLat = Number.parseFloat(lat)
        const userLng = Number.parseFloat(lng)
        searchResults = await sql`
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
            ) as hashtags,
            (
              6371 * acos(
                cos(radians(${userLat})) * 
                cos(radians(p.location_lat)) * 
                cos(radians(p.location_lng) - radians(${userLng})) + 
                sin(radians(${userLat})) * 
                sin(radians(p.location_lat))
              )
            ) AS distance
          FROM posts p
          LEFT JOIN post_hashtags ph ON p.id = ph.post_id
          LEFT JOIN hashtags h ON ph.hashtag_id = h.id
          WHERE p.content ILIKE ${`%${query}%`}
          GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
          ORDER BY distance ASC NULLS LAST, p.created_at DESC
          LIMIT 50
        `
      } else {
        searchResults = await sql`
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
          FROM posts p
          LEFT JOIN post_hashtags ph ON p.id = ph.post_id
          LEFT JOIN hashtags h ON ph.hashtag_id = h.id
          WHERE p.content ILIKE ${`%${query}%`}
          GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
          ORDER BY p.created_at DESC
          LIMIT 50
        `
      }
    } else if (hashtags) {
      // Hashtag search only
      const hashtagList = hashtags.split(",").map((tag) => tag.trim())
      if (lat && lng) {
        const userLat = Number.parseFloat(lat)
        const userLng = Number.parseFloat(lng)
        searchResults = await sql`
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
            ) as hashtags,
            (
              6371 * acos(
                cos(radians(${userLat})) * 
                cos(radians(p.location_lat)) * 
                cos(radians(p.location_lng) - radians(${userLng})) + 
                sin(radians(${userLat})) * 
                sin(radians(p.location_lat))
              )
            ) AS distance
          FROM posts p
          LEFT JOIN post_hashtags ph ON p.id = ph.post_id
          LEFT JOIN hashtags h ON ph.hashtag_id = h.id
          WHERE h.name = ANY(${hashtagList})
          GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
          ORDER BY distance ASC NULLS LAST, p.created_at DESC
          LIMIT 50
        `
      } else {
        searchResults = await sql`
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
          FROM posts p
          LEFT JOIN post_hashtags ph ON p.id = ph.post_id
          LEFT JOIN hashtags h ON ph.hashtag_id = h.id
          WHERE h.name = ANY(${hashtagList})
          GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
          ORDER BY p.created_at DESC
          LIMIT 50
        `
      }
    } else {
      // No search criteria, return recent posts
      searchResults = await sql`
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
        FROM posts p
        LEFT JOIN post_hashtags ph ON p.id = ph.post_id
        LEFT JOIN hashtags h ON ph.hashtag_id = h.id
        GROUP BY p.id, p.content, p.image_url, p.location_description, p.location_lat, p.location_lng, p.created_at
        ORDER BY p.created_at DESC
        LIMIT 50
      `
    }

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error("Error searching posts:", error)
    return NextResponse.json({ error: "Failed to search posts" }, { status: 500 })
  }
}
