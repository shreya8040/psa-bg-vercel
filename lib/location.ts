// Location service utilities
export interface LocationData {
  lat: number
  lng: number
  description: string
  accuracy?: number
}

export interface LocationError {
  code: number
  message: string
}

// Bangalore area boundaries for better location detection
const BANGALORE_AREAS = [
  { name: "Koramangala", lat: 12.9352, lng: 77.6245, radius: 2 },
  { name: "Indiranagar", lat: 12.9719, lng: 77.6412, radius: 2 },
  { name: "Whitefield", lat: 12.9698, lng: 77.75, radius: 3 },
  { name: "Electronic City", lat: 12.8456, lng: 77.6603, radius: 3 },
  { name: "Marathahalli", lat: 12.9591, lng: 77.6974, radius: 2 },
  { name: "Silk Board", lat: 12.9165, lng: 77.6223, radius: 1.5 },
  { name: "HSR Layout", lat: 12.9116, lng: 77.637, radius: 2 },
  { name: "BTM Layout", lat: 12.9165, lng: 77.6101, radius: 2 },
  { name: "Jayanagar", lat: 12.9237, lng: 77.5838, radius: 2 },
  { name: "JP Nagar", lat: 12.9077, lng: 77.5859, radius: 2 },
  { name: "Banashankari", lat: 12.9249, lng: 77.55, radius: 2 },
  { name: "Rajajinagar", lat: 12.9915, lng: 77.5552, radius: 2 },
  { name: "Malleshwaram", lat: 12.9941, lng: 77.575, radius: 1.5 },
  { name: "Basavanagudi", lat: 12.9395, lng: 77.5731, radius: 1.5 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963, radius: 3 },
  { name: "Hebbal", lat: 13.0358, lng: 77.597, radius: 2 },
  { name: "RT Nagar", lat: 13.02, lng: 77.595, radius: 1.5 },
  { name: "Sadashivanagar", lat: 12.999, lng: 77.585, radius: 1.5 },
  { name: "MG Road", lat: 12.9716, lng: 77.6197, radius: 1 },
  { name: "Brigade Road", lat: 12.9716, lng: 77.6099, radius: 1 },
  { name: "Commercial Street", lat: 12.9833, lng: 77.6167, radius: 0.8 },
  { name: "Cunningham Road", lat: 12.9833, lng: 77.595, radius: 1 },
  { name: "Richmond Road", lat: 12.9667, lng: 77.6, radius: 1 },
  { name: "Residency Road", lat: 12.9667, lng: 77.6167, radius: 1 },
  { name: "Domlur", lat: 12.9611, lng: 77.6387, radius: 1.5 },
  { name: "Old Airport Road", lat: 12.95, lng: 77.65, radius: 2 },
  { name: "Sarjapur Road", lat: 12.9, lng: 77.68, radius: 3 },
  { name: "Outer Ring Road", lat: 12.93, lng: 77.69, radius: 4 },
  { name: "Bannerghatta Road", lat: 12.89, lng: 77.6, radius: 3 },
  { name: "Mysore Road", lat: 12.92, lng: 77.54, radius: 3 },
]

export class LocationService {
  private static instance: LocationService
  private currentLocation: LocationData | null = null

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({ code: 0, message: "Geolocation not supported by this browser" })
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords
            const description = await this.getDetailedLocation(latitude, longitude)

            const locationData: LocationData = {
              lat: latitude,
              lng: longitude,
              description,
              accuracy,
            }

            this.currentLocation = locationData
            resolve(locationData)
          } catch (error) {
            reject({ code: 4, message: "Failed to get location description" })
          }
        },
        (error) => {
          let message = "Unknown location error"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user"
              break
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable"
              break
            case error.TIMEOUT:
              message = "Location request timed out"
              break
          }
          reject({ code: error.code, message })
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000, // 5 minutes
        },
      )
    })
  }

  private async getDetailedLocation(lat: number, lng: number): Promise<string> {
    try {
      // First, check if location is in a known Bangalore area
      const nearbyArea = this.findNearestBangaloreArea(lat, lng)

      // Get detailed address from geocoding API
      const geocodedAddress = await this.reverseGeocode(lat, lng)

      // Combine area name with detailed address for better context
      if (nearbyArea) {
        return `${nearbyArea}, ${geocodedAddress}`
      }

      return geocodedAddress
    } catch (error) {
      // Fallback to area detection only
      const nearbyArea = this.findNearestBangaloreArea(lat, lng)
      return nearbyArea || "Bangalore, Karnataka"
    }
  }

  private findNearestBangaloreArea(lat: number, lng: number): string | null {
    let nearestArea = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const area of BANGALORE_AREAS) {
      const distance = this.calculateDistance(lat, lng, area.lat, area.lng)

      // Check if location is within the area's radius
      if (distance <= area.radius && distance < minDistance) {
        minDistance = distance
        nearestArea = area.name
      }
    }

    return nearestArea
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      )
      const data = await response.json()

      // Build a more detailed description prioritizing local areas
      const parts = []

      // Add street/road information if available
      if (data.localityInfo?.administrative?.[4]?.name) {
        parts.push(data.localityInfo.administrative[4].name)
      }

      // Add locality/neighborhood
      if (data.locality && !parts.includes(data.locality)) {
        parts.push(data.locality)
      }

      // Add city if different from locality
      if (data.city && data.city !== data.locality && !parts.includes(data.city)) {
        parts.push(data.city)
      }

      // Ensure we always show Bangalore context
      if (!parts.some((part) => part.toLowerCase().includes("bangalore") || part.toLowerCase().includes("bengaluru"))) {
        parts.push("Bangalore")
      }

      return parts.length > 0 ? parts.join(", ") : "Bangalore, Karnataka"
    } catch (error) {
      return "Bangalore, Karnataka"
    }
  }

  // Calculate distance between two points in kilometers
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`
    }
    return `${distance.toFixed(1)}km away`
  }

  getCachedLocation(): LocationData | null {
    return this.currentLocation
  }

  async checkLocationPermission(): Promise<"granted" | "denied" | "prompt"> {
    if (!navigator.permissions) {
      return "prompt" // Fallback for browsers without permissions API
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" })
      return result.state
    } catch (error) {
      return "prompt"
    }
  }
}
