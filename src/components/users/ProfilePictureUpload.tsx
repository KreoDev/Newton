"use client"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useAlert } from "@/hooks/useAlert"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { userOperations } from "@/lib/firebase-utils"
import Image from "next/image"

interface ProfilePictureUploadProps {
  onUploadComplete?: () => void
}

export function ProfilePictureUpload({ onUploadComplete }: ProfilePictureUploadProps) {
  const { user, refreshUser } = useAuth()
  const { showSuccess, showError } = useAlert()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"]
    if (!validTypes.includes(file.type)) {
      showError("Invalid File Type", "Please upload a JPG or PNG image.")
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      showError("File Too Large", "Maximum file size is 10MB.")
      return
    }

    setUploading(true)

    try {
      // Create storage reference
      const timestamp = Date.now()
      const fileName = `profile-pictures/${user.id}/${timestamp}-${file.name}`
      const storageRef = ref(storage, fileName)

      // Upload file
      await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Delete old profile picture if exists
      if (user.profilePicture && user.profilePicture.includes("firebase")) {
        try {
          const oldRef = ref(storage, user.profilePicture)
          await deleteObject(oldRef)
        } catch (error) {
          // Ignore errors when deleting old image (might not exist)
        }
      }

      // Update user document with new profile picture URL
      await userOperations.update(user.id, {
        profilePicture: downloadURL,
      })

      // Refresh user data in context
      await refreshUser()

      showSuccess("Profile Picture Updated", "Your profile picture has been updated successfully!")

      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error) {
      showError("Upload Failed", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-start gap-6">
      {/* Avatar Preview */}
      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
        {user?.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt="Profile Picture"
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex-1">
        <h4 className="font-medium mb-1">Profile Picture</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Upload a new avatar. JPG or PNG, max 10MB.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Change Avatar"}
        </Button>
      </div>
    </div>
  )
}
