import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db" // Use centralized database client

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const hashtags = searchParams.get("hashtags")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    const makeHashtagArray = (csv: string) => {
      // strip leading '#', trim, lowercase, and drop empties
      const list = csv
        .split(",")
        .map((t) => t.replace(/^#/, "").trim().toLowerCase())
        .filter(Boolean)

      // IMPORTANT: Neon requires explicit array typing for ANY(); use text[]
      // Many drivers accept: ANY(${sql.array(list, 'text')})
      // If your sql helper doesn't expose array(), we fall back to string_to_array().
      return { list }
    }

    let searchResults

    if (query && hashtags) {
      const { list } = makeHashtagArray(hashtags)
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
            AND lower(h.name) = ANY(string_to_array(${list.join(",")}, ',')::text[])
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
            AND lower(h.name) = ANY(string_to_array(${list.join(",")}, ',')::text[])
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
      const { list } = makeHashtagArray(hashtags)
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
          WHERE lower(h.name) = ANY(string_to_array(${list.join(",")}, ',')::text[])
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
          WHERE lower(h.name) = ANY(string_to_array(${list.join(",")}, ',')::text[])
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
