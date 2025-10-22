"use client"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload, X } from "lucide-react"
import { useAlert } from "@/hooks/useAlert"
import { userOperations } from "@/lib/firebase-utils"
import { utilityService } from "@/services/utility.service"
import Image from "next/image"

interface AvatarUploadProps {
  userId: string
  currentAvatar?: string
  userName?: string
  onAvatarUpdated: (avatarBase64: string) => void
}

export function AvatarUpload({ userId, currentAvatar, userName, onAvatarUpdated }: AvatarUploadProps) {
  const { showSuccess, showError } = useAlert()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>("")
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isUploading, setIsUploading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        showError("Invalid File Type", "Please select a JPG or PNG image.")
        return
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError("File Too Large", "Image size must be less than 10MB.")
        return
      }

      const reader = new FileReader()
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || "")
        setIsModalOpen(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1, // aspect ratio 1:1 for square
        width,
        height
      ),
      width,
      height
    )
    setCrop(crop)
  }, [])

  const getCroppedImg = useCallback(async (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width
    canvas.height = crop.height

    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height)

    return canvas.toDataURL("image/jpeg", 0.7)
  }, [])

  const handleSaveAvatar = async () => {
    if (!imgRef.current || !completedCrop) {
      showError("Missing Image", "Please select and crop an image first.")
      return
    }

    setIsUploading(true)
    try {
      // Get cropped image
      const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop)

      // Resize to 150x150 using the utility service
      const resizedBase64 = (await utilityService.resizeImage(croppedImageUrl, 0.7, 150, 150)) as unknown as string

      // Save to Firestore
      await userOperations.update(userId, { profilePicture: resizedBase64 })

      // Update parent component
      onAvatarUpdated(resizedBase64)

      showSuccess("Avatar Updated", "Your profile picture has been updated successfully!")
      setIsModalOpen(false)
      setImageSrc("")
      setCrop(undefined)
      setCompletedCrop(undefined)
    } catch (error) {
      showError("Failed to Save Avatar", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setImageSrc("")
    setCrop(undefined)
    setCompletedCrop(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <Avatar className="h-24 w-24">
            <AvatarImage src={currentAvatar || "/blank-avatar.jpg"} alt={userName || "User avatar"} />
            <AvatarFallback className="text-lg">{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Profile Picture</h4>
          <p className="text-sm text-muted-foreground">Upload a new avatar. JPG or PNG, max 10MB.</p>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Change Avatar
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={onSelectFile} className="hidden" />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Your Avatar</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {imageSrc && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop>
                    <Image ref={imgRef} alt="Crop me" src={imageSrc} width={400} height={400} style={{ maxHeight: "400px", maxWidth: "100%", objectFit: "contain" }} onLoad={onImageLoad} unoptimized />
                  </ReactCrop>
                </div>

                <div className="w-32 space-y-2">
                  <p className="text-sm font-medium">Preview:</p>
                  <div className="w-24 h-24 mx-auto">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={imageSrc} alt="Preview" />
                      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveAvatar} disabled={isUploading || !completedCrop}>
              {isUploading ? "Saving..." : "Save Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
