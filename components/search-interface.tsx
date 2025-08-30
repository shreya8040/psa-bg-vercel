"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Hash, MapPin, Clock, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SearchResult {
  id: number
  content: string
  location_description: string | null
  created_at: string
  hashtags: string[]
  distance?: number
}

interface PopularHashtag {
  name: string
  count: number
}

interface SearchInterfaceProps {
  userLocation?: { lat: number; lng: number } | null
}

export function SearchInterface({ userLocation }: SearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [popularHashtags, setPopularHashtags] = useState<PopularHashtag[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  const safeToast = (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    try {
      if (typeof toast === "function") toast(opts)
    } catch (err) {
      console.warn("[v0] toast unavailable:", err)
    }
  }

  const fetchWithSafety = async (url: string, init?: RequestInit, timeoutMs = 10000) => {
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), timeoutMs)

      // add cache buster to avoid PWA cached responses
      const ts = Date.now().toString()
      const urlObj = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost")
      urlObj.searchParams.set("__ts", ts)

      const res = await fetch(urlObj.toString(), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          ...(init?.headers || {}),
        },
        signal: controller.signal,
        ...init,
      })
      clearTimeout(t)

      // Try JSON first; if it fails, fall back to text
      let data: any = null
      const text = await res.text()
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = text
      }
      return { ok: res.ok, status: res.status, data }
    } catch (error) {
      console.error("[v0] fetchWithSafety error:", error)
      return { ok: false, status: 0, data: null as any }
    }
  }

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await fetchPopularHashtags()
      } catch (error) {
        console.error("Failed to initialize search component:", error)
      }
    }
    initializeComponent()
  }, [])

  const fetchPopularHashtags = async () => {
    try {
      const { ok, data, status } = await fetchWithSafety("/api/hashtags/popular", { method: "GET" })
      if (ok) {
        setPopularHashtags(Array.isArray(data) ? data : [])
      } else {
        console.warn("Failed to fetch popular hashtags:", status)
        setPopularHashtags([])
      }
    } catch (error) {
      console.error("Failed to fetch popular hashtags:", error)
      setPopularHashtags([])
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasQuery = searchQuery && searchQuery.trim().length > 0
    const hasFilters = activeFilters && activeFilters.length > 0

    if (!hasQuery && !hasFilters) {
      safeToast({
        title: "Search required",
        description: "Please enter a search term or select a hashtag.",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()

      if (hasQuery) {
        params.append("q", searchQuery.trim())
      }

      if (hasFilters) {
        params.append("hashtags", activeFilters.join(","))
      }

      if (userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number") {
        params.append("lat", userLocation.lat.toString())
        params.append("lng", userLocation.lng.toString())
      }

      const url = `/api/posts/search?${params.toString()}`
      console.log("Searching with URL:", url)

      const { ok, data, status } = await fetchWithSafety(url, { method: "GET" })
      if (ok && Array.isArray(data)) {
        setSearchResults(data)
      } else if (ok && data && typeof data === "object" && Array.isArray((data as any).results)) {
        setSearchResults((data as any).results)
      } else {
        console.error("Search API error:", status, data)
        throw new Error(`Search failed: ${status}`)
      }
    } catch (error) {
      console.error("Search error:", error)
      safeToast({
        title: "Search failed",
        description: "Could not search posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const addHashtagFilter = (hashtag: string) => {
    if (hashtag && typeof hashtag === "string" && !activeFilters.includes(hashtag)) {
      setActiveFilters([...activeFilters, hashtag])
    }
  }

  const removeHashtagFilter = (hashtag: string) => {
    setActiveFilters(activeFilters.filter((tag) => tag !== hashtag))
  }

  const clearSearch = () => {
    setSearchQuery("")
    setActiveFilters([])
    setSearchResults([])
    setHasSearched(false)
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      return `${Math.floor(diffMins / 1440)}d ago`
    } catch (error) {
      console.error("Error formatting time:", error)
      return "Unknown time"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Search PSAs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for road blocks, construction, areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Filters:</span>
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="flex items-center gap-1">
                  #{filter}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-600"
                    onClick={() => removeHashtagFilter(filter)}
                  />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={clearSearch} className="h-6 text-xs">
                Clear all
              </Button>
            </div>
          )}
        </form>

        {/* Popular Hashtags */}
        {!hasSearched && popularHashtags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Popular Areas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularHashtags.map((hashtag) => (
                <Badge
                  key={hashtag.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => addHashtagFilter(hashtag.name)}
                >
                  #{hashtag.name} ({hashtag.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
              </span>
              {searchResults.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  New Search
                </Button>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No PSAs found matching your search.</p>
                <p className="text-xs mt-1">Try different keywords or hashtags.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p className="text-gray-900 mb-2">{post.content}</p>

                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.hashtags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-blue-100"
                            onClick={() => addHashtagFilter(tag)}
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{post.location_description || "Location not specified"}</span>
                        </div>
                        {post.distance !== undefined && (
                          <span className="text-green-600">{post.distance.toFixed(1)}km away</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
