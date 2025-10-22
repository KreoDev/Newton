import { log } from "@/services/console.service"

const colorPalette = ["#8B5CF6", "#EC4899", "#10B981", "#3B82F6", "#F97316", "#14B8A6", "#6366F1", "#D946EF", "#F59E0B", "#06B6D4"]

class Utility {
  private static instance: Utility

  private constructor() {
    log.loaded("Utility")
  }

  static getInstance(): Utility {
    if (!Utility.instance) {
      Utility.instance = new Utility()
    }
    return Utility.instance
  }

  resizeImage(img, quality: number = 0.7, MAX_WIDTH: number = 800, MAX_HEIGHT: number = 800) {
    return new Promise<boolean>(async resolve => {
      const canvas: any = document.createElement("canvas")
      const image = new Image()
      image.onload = () => {
        let { width, height } = image
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(image, 0, 0, width, height)
        // IMPORTANT: 'jpeg' NOT 'jpg'
        const base64 = canvas.toDataURL("image/jpeg", quality)
        resolve(base64)
      }
      image.src = img
    }) //new Promise()
  } //end generateFromImage()

  generateColorFromString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colorPalette.length
    return colorPalette[index]
  }

  makeId(length: number): string {
    let result = ""
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }
}

export const utilityService = Utility.getInstance()
