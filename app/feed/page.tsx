"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Filter, MapPin, Clock, RefreshCwIcon as Refresh, ChevronDown } from "lucide-react"
import Link from "next/link"
import { PostUpdates } from "@/components/post-updates"

interface Post {
  id: number
  content: string
  location_description: string | null
  location_lat: number | null
  location_lng: number | null
  created_at: string
  hashtags: string[]
  image_url: string | null
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "recent" | "with-images">("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          if (reset || pageNum === 1) {
            setPosts(data)
          } else {
            setPosts((prev) => [...prev, ...data])
          }
          setHasMore(data.length === 10)
        } else {
          setPosts([])
          setHasMore(false)
        }
      } else {
        setError("Failed to load posts")
        setPosts([])
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      setError("Unable to connect to server")
      setPosts([])
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(1, true)
    setPage(1)
  }, [fetchPosts])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage, false)
  }

  const refreshFeed = () => {
    setPage(1)
    setHasMore(true)
    fetchPosts(1, true)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffMins / 1440)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredPosts = posts.filter((post) => {
    switch (filter) {
      case "recent":
        const hourAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return new Date(post.created_at) > hourAgo
      case "with-images":
        return post.image_url !== null
      default:
        return true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Latest PSAs</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshFeed} disabled={loading}>
            <Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              All Posts
            </Button>
            <Button variant={filter === "recent" ? "default" : "outline"} size="sm" onClick={() => setFilter("recent")}>
              Last 24h
            </Button>
            <Button
              variant={filter === "with-images" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("with-images")}
            >
              With Photos
            </Button>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <main className="px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={refreshFeed}>Try Again</Button>
            </CardContent>
          </Card>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                {filter === "all"
                  ? "No PSAs yet. Be the first to report a transit issue!"
                  : `No posts found for "${filter}" filter.`}
              </p>
              {filter !== "all" && (
                <Button variant="outline" onClick={() => setFilter("all")} className="mt-2">
                  Show All Posts
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <p className="text-gray-900 mb-3 leading-relaxed">{post.content}</p>

                    {post.image_url && (
                      <div className="mb-3">
                        <img
                          src={post.image_url || "/placeholder.svg"}
                          alt="PSA Photo"
                          className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-200"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    )}

                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.hashtags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{post.location_description || "Location not specified"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(post.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        onClick={() => alert(`Add update to post ${post.id}`)}
                      >
                        💬 Add Update / Reply
                      </Button>
                    </div>
                  </CardContent>
                  <PostUpdates postId={post.id} />
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="mt-6 text-center">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-full max-w-xs bg-transparent"
                >
                  {loadingMore ? (
                    <>
                      <Refresh className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Load More Posts
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
