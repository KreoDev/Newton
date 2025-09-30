import { signal, Signal } from "@preact/signals-react"
import { log } from "@/services/console.service"
import { db } from "@/lib/firebase"

class Data {
  private static instance: Data

  private constructor() {
    log.loaded("Data")
  }

  static getInstance(): Data {
    if (!Data.instance) {
      Data.instance = new Data()
    }
    return Data.instance
  }
}

export const data = Data.getInstance()
