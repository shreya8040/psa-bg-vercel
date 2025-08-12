"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Navigation } from "lucide-react"
import { LocationService } from "@/lib/location"

interface Post {
  id: number
  content: string
  location_description: string | null
  location_lat: number | null
  location_lng: number | null
  created_at: string
  hashtags: string[]
  distance?: number
  image_url: string | null
}

interface NearbyPostsProps {
  userLocation: { lat: number; lng: number } | null
}

export function NearbyPosts({ userLocation }: NearbyPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [radius, setRadius] = useState(5) // Default 5km radius

  const locationService = LocationService.getInstance()

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPosts()
    }
  }, [userLocation, radius])

  const fetchNearbyPosts = async () => {
    if (!userLocation) return

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`)
      if (response.ok) {
        const data = await response.json()

        // Calculate distances and sort by proximity
        const postsWithDistance = data
          .map((post: Post) => ({
            ...post,
            distance:
              post.location_lat && post.location_lng
                ? locationService.calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    post.location_lat,
                    post.location_lng,
                  )
                : null,
          }))
          .sort((a: Post, b: Post) => {
            if (a.distance === null) return 1
            if (b.distance === null) return -1
            return a.distance - b.distance
          })

        setPosts(postsWithDistance)
      }
    } catch (error) {
      console.error("Failed to fetch nearby posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (!userLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nearby Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Enable location to see nearby PSAs</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Nearby Alerts</CardTitle>
          <div className="flex gap-2">
            {[2, 5, 10].map((r) => (
              <Button
                key={r}
                variant={radius === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRadius(r)}
                className="text-xs"
              >
                {r}km
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-gray-500">Finding nearby PSAs...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No PSAs found within {radius}km. Try increasing the radius.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <p className="text-gray-900 mb-2">{post.content}</p>

              {post.image_url && (
                <div className="mb-3">
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt="PSA Photo"
                    className="w-full max-w-sm h-48 object-cover rounded-md border border-gray-200"
                  />
                </div>
              )}

              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.hashtags.map((tag, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{post.location_description || "Location not specified"}</span>
                  </div>
                  {post.distance !== null && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Navigation className="h-3 w-3" />
                      <span>{locationService.formatDistance(post.distance)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(post.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
