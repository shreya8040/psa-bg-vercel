"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Send, Hash, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { LocationService } from "@/lib/location"

export function QuickPostForm() {
  const [content, setContent] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number; description: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showLocationError, setShowLocationError] = useState(false)
  const { toast } = useToast()

  const getLocation = async () => {
    setIsGettingLocation(true)
    setShowLocationError(false)

    try {
      const locationService = LocationService.getInstance()
      const locationData = await locationService.getCurrentLocation()

      setLocation({
        lat: locationData.lat,
        lng: locationData.lng,
        description: locationData.description,
      })

      toast({
        title: "Location captured",
        description: locationData.description,
      })
    } catch (error: any) {
      toast({
        title: "Location error",
        description: error.message || "Could not get your location. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please describe the transit issue.",
        variant: "destructive",
      })
      return
    }

    if (!location) {
      setShowLocationError(true)
      toast({
        title: "Location required",
        description: "Please click 'Get GPS' to capture your location before posting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          hashtags: hashtags.split(" ").filter((tag) => tag.startsWith("#")),
          location,
          image: selectedImage,
        }),
      })

      if (!response.ok) throw new Error("Failed to post")

      toast({
        title: "PSA posted!",
        description: "Your transit alert has been shared.",
      })

      setContent("")
      setHashtags("")
      setLocation(null)
      setSelectedImage(null)
      setShowLocationError(false)
    } catch (error) {
      toast({
        title: "Post failed",
        description: "Could not post your PSA. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Report Transit Issue</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Describe the road block, construction, or transit issue..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] text-base resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{content.length}/500 characters</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Area Tags</span>
            </div>
            <Textarea
              placeholder="#koramangala #silkboard #traffic"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="min-h-[60px] text-base resize-none"
              rows={2}
            />
          </div>

          <ImageUpload onImageSelect={setSelectedImage} selectedImage={selectedImage} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Location *</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
                disabled={isGettingLocation}
                className="text-xs bg-transparent"
              >
                {isGettingLocation ? "Getting..." : "Get GPS"}
              </Button>
            </div>

            {showLocationError && !location && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Location Required</p>
                  <p className="text-xs text-red-600 mt-1">
                    You must capture your GPS location before posting a PSA. Click "Get GPS" above.
                  </p>
                </div>
              </div>
            )}

            {location && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">📍 {location.description}</p>
                <p className="text-xs text-green-600 mt-1">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="w-full h-12 text-base font-medium"
          >
            {isSubmitting ? (
              "Posting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post PSA Alert
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
