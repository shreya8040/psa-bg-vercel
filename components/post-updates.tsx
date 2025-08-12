"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ImageUpload } from "@/components/image-upload"
import { MessageCircle, Send } from "lucide-react"

interface PostUpdate {
  id: number
  content: string
  image_url?: string
  user_session: string
  created_at: string
}

interface PostUpdatesProps {
  postId: number
}

export function PostUpdates({ postId }: PostUpdatesProps) {
  const [updates, setUpdates] = useState<PostUpdate[]>([])
  const [showUpdates, setShowUpdates] = useState(false)
  const [newUpdate, setNewUpdate] = useState("")
  const [updateImage, setUpdateImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const fetchUpdates = async () => {
    if (!showUpdates) return

    setIsLoading(true)
    setHasError(false)
    try {
      const response = await fetch(`/api/posts/${postId}/updates`)
      if (response.ok) {
        const data = await response.json()
        setUpdates(data.updates || [])
      } else {
        console.error("Failed to fetch updates:", response.status)
        setHasError(true)
      }
    } catch (error) {
      console.error("Error fetching updates:", error)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUpdates()
  }, [showUpdates, postId])

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUpdate.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newUpdate,
          image: updateImage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUpdates((prev) => [...prev, data.update])
        setNewUpdate("")
        setUpdateImage(null)
        setHasError(false)
      } else {
        console.error("Failed to submit update:", response.status)
      }
    } catch (error) {
      console.error("Error submitting update:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="mt-6 pt-4 border-t-2 border-blue-100">
      <Button
        variant={showUpdates ? "default" : "outline"}
        size="default"
        onClick={() => setShowUpdates(!showUpdates)}
        className="flex items-center gap-2 w-full justify-center bg-blue-500 hover:bg-blue-600 text-white border-0 py-3 text-base font-semibold shadow-md"
      >
        <MessageCircle className="h-5 w-5" />
        {showUpdates ? "Hide Updates" : `💬 Add Update / Reply (${updates.length})`}
      </Button>

      {showUpdates && (
        <div className="mt-4 space-y-4">
          {/* Add Update Form */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <form onSubmit={handleSubmitUpdate} className="space-y-3">
              <Textarea
                placeholder="Add an update, reply, or additional information about this PSA..."
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                className="min-h-[80px] resize-none"
              />

              <ImageUpload onImageSelect={setUpdateImage} selectedImage={updateImage} />

              <Button
                type="submit"
                disabled={!newUpdate.trim() || isSubmitting}
                size="sm"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Posting..." : "Post Update"}
              </Button>
            </form>
          </Card>

          {/* Updates List */}
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading updates...</div>
          ) : hasError ? (
            <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm">Updates feature is being set up. Please run the database migration script.</p>
            </div>
          ) : updates.length > 0 ? (
            <div className="space-y-3">
              {updates.map((update) => (
                <Card key={update.id} className="p-4 bg-gray-50">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-800">{update.content}</p>

                    {update.image_url && (
                      <img
                        src={update.image_url || "/placeholder.svg"}
                        alt="Update image"
                        className="w-full max-w-sm rounded-lg object-cover"
                        loading="lazy"
                      />
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Anonymous User</span>
                      <span>{formatTime(update.created_at)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No updates yet. Be the first to add one!</div>
          )}
        </div>
      )}
    </div>
  )
}
