"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, MessageCircle } from "lucide-react"

interface Post {
  id: number
  content: string
  location_description: string | null
  created_at: string
  hashtags: string[]
  image_url: string | null
  updates?: Update[]
}

interface Update {
  id: number
  content: string
  created_at: string
}

export function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpdateForm, setShowUpdateForm] = useState<number | null>(null)
  const [updateContent, setUpdateContent] = useState("")
  const [submittingUpdate, setSubmittingUpdate] = useState(false)
  const [expandedUpdates, setExpandedUpdates] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setError(null)
      const response = await fetch("/api/posts")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const postsWithUpdates = await Promise.all(
            data.map(async (post) => {
              try {
                const updatesResponse = await fetch(`/api/posts/${post.id}/updates`)
                if (updatesResponse.ok) {
                  const updates = await updatesResponse.json()
                  return { ...post, updates }
                }
              } catch (error) {
                console.error(`Failed to fetch updates for post ${post.id}:`, error)
              }
              return { ...post, updates: [] }
            }),
          )
          setPosts(postsWithUpdates)
        } else {
          setPosts([])
        }
      } else {
        setError("Failed to load posts")
        setPosts([])
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      setError("Unable to connect to server")
      setPosts([])
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

  const handleAddUpdate = async (postId: number) => {
    if (!updateContent.trim()) return

    setSubmittingUpdate(true)
    try {
      const response = await fetch(`/api/posts/${postId}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: updateContent.trim(),
        }),
      })

      if (response.ok) {
        setUpdateContent("")
        setShowUpdateForm(null)
        fetchPosts()
      } else {
        alert("Failed to add update. Please try again.")
      }
    } catch (error) {
      console.error("Error adding update:", error)
      alert("Failed to add update. Please try again.")
    } finally {
      setSubmittingUpdate(false)
    }
  }

  const toggleUpdates = (postId: number) => {
    const newExpanded = new Set(expandedUpdates)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedUpdates(newExpanded)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading recent PSAs...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No PSAs yet. Be the first to report a transit issue!</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="border border-gray-200">
              <CardContent className="p-4">
                <p className="text-gray-900 mb-3 leading-relaxed">{post.content}</p>

                {post.image_url && (
                  <div className="mb-3">
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt="PSA Photo"
                      className="w-full max-w-md h-48 object-cover rounded-md border border-gray-200"
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
                      <span key={index} className="text-xs px-2 py-1 rounded-full font-medium bg-lime-200 text-black">
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

                <div className="mt-2 flex gap-2">
                  {showUpdateForm === post.id ? (
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={updateContent}
                        onChange={(e) => setUpdateContent(e.target.value)}
                        placeholder="Add an update or reply..."
                        className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                        rows={3}
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddUpdate(post.id)}
                          disabled={!updateContent.trim() || submittingUpdate}
                          className="bg-orange-300 hover:bg-orange-400 text-black"
                        >
                          {submittingUpdate ? "Posting..." : "Post Update"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowUpdateForm(null)
                            setUpdateContent("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm border-0 rounded-xl bg-amber-200"
                        onClick={() => setShowUpdateForm(post.id)}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Add Update
                      </Button>
                      {post.updates && post.updates.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-sm border-0 rounded-xl bg-orange-300"
                          onClick={() => toggleUpdates(post.id)}
                        >
                          {expandedUpdates.has(post.id) ? "Hide" : "View"} Updates ({post.updates.length})
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {post.updates && post.updates.length > 0 && expandedUpdates.has(post.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Updates:</h4>
                    <div className="space-y-3">
                      {post.updates.map((update) => (
                        <div key={update.id} className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-800 mb-1">{update.content}</p>
                          <p className="text-xs text-gray-500">{formatTime(update.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  )
}
