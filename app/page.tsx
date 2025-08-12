"use client"

import { QuickPostForm } from "@/components/quick-post-form"
import { RecentPosts } from "@/components/recent-posts"
import { LocationPermission } from "@/components/location-permission"
import { NearbyPosts } from "@/components/nearby-posts"
import { SearchInterface } from "@/components/search-interface"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Search, Plus, List } from "lucide-react"

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showNearby, setShowNearby] = useState(false)
  const [activeTab, setActiveTab] = useState<"feed" | "post" | "nearby" | "search">("feed")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-gray-900 text-4xl" style={{ fontFamily: "var(--font-lexend)" }}>
            PSA Bengaluru
          </h1>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="flex space-x-1">
          <Button
            variant={activeTab === "feed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("feed")}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Feed
          </Button>
          <Button
            variant={activeTab === "post" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("post")}
            className="flex items-center gap-2 bg-orange-300"
          >
            <Plus className="h-4 w-4" />
            Post
          </Button>
          <Button
            variant={activeTab === "nearby" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("nearby")}
            className="flex items-center gap-2 bg-lime-200"
          >
            Nearby
          </Button>
          <Button
            variant={activeTab === "search" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("search")}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </nav>

      <main className="px-4 py-6 space-y-6">
        <LocationPermission
          onLocationGranted={(location) => {
            setUserLocation({ lat: location.lat, lng: location.lng })
            setShowNearby(true)
          }}
          onLocationDenied={() => setShowNearby(false)}
        />

        {activeTab === "feed" && <RecentPosts />}

        {activeTab === "post" && <QuickPostForm />}

        {activeTab === "search" && <SearchInterface userLocation={userLocation} />}

        {activeTab === "nearby" && showNearby ? (
          <NearbyPosts userLocation={userLocation} />
        ) : activeTab === "nearby" ? (
          <RecentPosts />
        ) : activeTab === "post" ? (
          showNearby ? (
            <NearbyPosts userLocation={userLocation} />
          ) : (
            <RecentPosts />
          )
        ) : null}
      </main>
    </div>
  )
}
