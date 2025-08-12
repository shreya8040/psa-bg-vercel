"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, AlertCircle } from "lucide-react"
import { LocationService } from "@/lib/location"

interface LocationPermissionProps {
  onLocationGranted?: (location: any) => void
  onLocationDenied?: () => void
}

export function LocationPermission({ onLocationGranted, onLocationDenied }: LocationPermissionProps) {
  const [permissionState, setPermissionState] = useState<"checking" | "granted" | "denied" | "prompt">("checking")
  const [isRequesting, setIsRequesting] = useState(false)

  const locationService = LocationService.getInstance()

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = async () => {
    const state = await locationService.checkLocationPermission()
    setPermissionState(state)

    if (state === "granted") {
      // Try to get location immediately if already granted
      try {
        const location = await locationService.getCurrentLocation()
        onLocationGranted?.(location)
      } catch (error) {
        // Permission might be granted but location unavailable
      }
    }
  }

  const requestLocation = async () => {
    setIsRequesting(true)
    try {
      const location = await locationService.getCurrentLocation()
      setPermissionState("granted")
      onLocationGranted?.(location)
    } catch (error: any) {
      if (error.code === 1) {
        // PERMISSION_DENIED
        setPermissionState("denied")
        onLocationDenied?.()
      }
    } finally {
      setIsRequesting(false)
    }
  }

  if (permissionState === "checking") {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-blue-600 animate-pulse" />
            <p className="text-sm text-blue-800">Checking location permissions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permissionState === "denied") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 mb-2">
                Location access is required to show nearby PSAs and add location to your posts.
              </p>
              <p className="text-xs text-red-600">
                Please enable location in your browser settings and refresh the page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permissionState === "prompt") {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-800 mb-3">
                Enable location to see nearby PSAs and automatically add your location to posts.
              </p>
              <Button
                onClick={requestLocation}
                disabled={isRequesting}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isRequesting ? "Getting Location..." : "Enable Location"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null // Permission granted, no UI needed
}
