"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  onImageSelect: (imageData: string | null) => void
  selectedImage: string | null
}

export function ImageUpload({ onImageSelect, selectedImage }: ImageUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const processImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onImageSelect(result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    onImageSelect(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const triggerCamera = () => {
    cameraInputRef.current?.click()
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Add Photo</span>
      </div>

      {selectedImage ? (
        <Card className="relative">
          <CardContent className="p-3">
            <div className="relative">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Selected"
                className="w-full h-48 object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
                className="absolute top-2 right-2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Photo will be attached to your PSA post</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={triggerCamera}
            className="h-20 flex-col gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Camera className="h-6 w-6 text-blue-600" />
            <span className="text-sm text-blue-700">Take Photo</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={triggerFileSelect}
            className="h-20 flex-col gap-2 bg-green-50 hover:bg-green-100 border-green-200"
          >
            <Upload className="h-6 w-6 text-green-600" />
            <span className="text-sm text-green-700">Upload Image</span>
          </Button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      <p className="text-xs text-gray-500">Supported: JPG, PNG, WebP (max 5MB)</p>
    </div>
  )
}
