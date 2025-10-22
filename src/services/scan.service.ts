import { log } from "@/services/console.service"

const TAG = "Scan Service"

class Scan {
  private static instance: Scan

  private constructor() {
    log.loaded(`Scan`)
  }

  static getInstance(): Scan {
    if (!Scan.instance) {
      Scan.instance = new Scan()
    }
    return Scan.instance
  }

  getID = (raw: string) => {
    if (raw.charAt(0) == "*" && raw.charAt(raw.length - 1) == "*") {
      raw = raw.slice(1, -1)
    }

    if (raw.includes("|") == false && raw.length != 13) {
      return { error: "Not an ID Card!" }
    } else {
      const idArray = raw.split("|")
      if (idArray.length > 11) {
        const idNumber = idArray[4]
        const dateOfBirthDateObject = this.parseDdMmmYyyyDate(idArray[5])
        console.log(TAG, "Raw DOB:", idArray[5], "Parsed DOB:", dateOfBirthDateObject)
        const age = this.getPersonAge(dateOfBirthDateObject)
        const gender = this.getPersonGender(idArray[2])
        const description = this.getPersonDescription(gender, age)

        const rawDateOfIssue = idArray[8]
        const dateOfIssueDateObject = this.parseDdMmmYyyyDate(rawDateOfIssue)

        return {
          age: age,
          cardNumber: idArray[10],
          countryOfBirth: idArray[6],
          dateOfBirth: this.formatDateToDdMmYyyy(dateOfBirthDateObject),
          dateOfIssue: this.formatDateToDdMmYyyy(dateOfIssueDateObject),
          description: description,
          gender: gender,
          identifier: idNumber,
          identifierType: "person",
          idNumber: idNumber,
          names: idArray[1],
          nationality: idArray[3],
          securityCode: idArray[9],
          status: idArray[7],
          surname: idArray[0],
          type: "SMARTID",
        }
      } else if (idArray.length == 1) {
        const idNumber = idArray[0]
        const genderPortion = idNumber.substring(6, 10)
        const statusPortion = idNumber.substring(10, 11)
        const dateOfBirthDateObject = this.getPersonDateOfBirth(idNumber)
        const age = this.getPersonAge(dateOfBirthDateObject)
        const gender = parseInt(genderPortion) < 5000 ? "FEMALE" : "MALE"
        const description = this.getPersonDescription(gender, age)
        const status = statusPortion == "0" ? "CITIZEN" : "PERMANENT RESIDENT"

        return {
          age: age,
          dateOfBirth: this.formatDateToDdMmYyyy(dateOfBirthDateObject),
          description: description,
          gender: gender,
          identifier: idNumber,
          identifierType: "person",
          idNumber: idNumber,
          status: status,
          type: "GREENBOOKID",
        }
      } else {
        return { error: "Not an ID" }
      }
    } //end if (raw.includes('|')
  }

  getVehicleLicence = (raw: string) => {
    if (raw.includes("%")) {
      const licenceArray = raw.split("%")

      if (licenceArray.length > 14) {
        const rawDateOfExpiryString = licenceArray[14]

        let expiryDateObject = new Date(NaN)
        if (rawDateOfExpiryString.includes("-")) {
          // YYYY-MM-DD
          const parts = rawDateOfExpiryString.split("-")
          if (parts.length === 3) {
            expiryDateObject = new Date(
              Date.UTC(
                parseInt(parts[0], 10),
                parseInt(parts[1], 10) - 1, // Month is 0-indexed
                parseInt(parts[2], 10)
              )
            )
          }
        } else if (rawDateOfExpiryString.length === 8 && /^\d+$/.test(rawDateOfExpiryString)) {
          // YYYYMMDD
          expiryDateObject = new Date(Date.UTC(parseInt(rawDateOfExpiryString.substring(0, 4), 10), parseInt(rawDateOfExpiryString.substring(4, 6), 10) - 1, parseInt(rawDateOfExpiryString.substring(6, 8), 10)))
        }

        if (isNaN(expiryDateObject.getTime())) {
          console.error(TAG, `Could not parse dateOfExpiry from string: ${rawDateOfExpiryString}. Attempting direct parse.`)
          // Fallback attempt, hoping it's a format new Date() can handle (might not be UTC based)
          const tempDate = new Date(rawDateOfExpiryString)
          // If parsed, convert to UTC date object
          if (!isNaN(tempDate.getTime())) {
            expiryDateObject = new Date(Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()))
          } else {
            console.error(TAG, `Direct parse also failed for dateOfExpiry: ${rawDateOfExpiryString}`)
          }
        }

        const todayDateObject = new Date()
        todayDateObject.setUTCHours(0, 0, 0, 0) // Compare date part only, in UTC

        // Clone expiryDateObject and clear time for comparison, ensuring it's a valid date first
        let isExpired = true
        let diffMonths = 0

        if (!isNaN(expiryDateObject.getTime())) {
          const expiryDateObjectForCompare = new Date(expiryDateObject)
          expiryDateObjectForCompare.setUTCHours(0, 0, 0, 0)
          isExpired = expiryDateObjectForCompare.getTime() < todayDateObject.getTime()
          diffMonths = isExpired ? this.getMonthDifference(expiryDateObject, new Date()) : this.getMonthDifference(new Date(), expiryDateObject)
        } else {
          console.error(TAG, "Cannot determine expiry status due to invalid expiry date.")
        }

        const expiredStatus = isNaN(expiryDateObject.getTime()) ? "Unknown" : isExpired ? "Expired" : "Valid"
        const expireStatusDuration = isNaN(expiryDateObject.getTime()) ? "N/A" : `${diffMonths} months`

        // ---- Normalisation helpers ----
        const toSentenceCase = (str: string) => {
          if (!str) return str
          // Insert space before capital letters that follow lowercase (HatchbackLuikrug -> Hatchback Luikrug)
          const spaced = str.replace(/([a-z])([A-Z])/g, "$1 $2")
          return spaced
            .toLowerCase()
            .split(/\s|\-|\//)
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        }

        // Map of English -> Afrikaans colour twins
        const colourTwins: Record<string, string> = {
          White: "Wit",
          Black: "Swart",
          Red: "Rooi",
          Blue: "Blou",
          Green: "Groen",
          Yellow: "Geel",
          Silver: "Silwer",
          Grey: "Grys",
          Brown: "Bruin",
          Orange: "Oranje",
          Pink: "Pienk",
          Purple: "Pers",
        }

        // Normalise Make & Model
        const makeRaw = licenceArray[9] || ""
        const modelRaw = licenceArray[10] || ""
        const make = toSentenceCase(makeRaw)
        const model = toSentenceCase(modelRaw)

        // Normalise Colour – take left part before '/' and sentence-case
        let colourRaw = licenceArray[11] || ""
        colourRaw = colourRaw.replace(/\s+/g, " ").trim()

        // Split on slash or treat concatenated twin words
        let colourParts: string[] = []
        if (colourRaw.includes("/")) {
          colourParts = colourRaw.split("/").map(p => p.trim())
        } else {
          // Attempt to split by twin mapping (e.g., Whitewit -> White Wit)
          const spaced = colourRaw.replace(/([a-z])([A-Z])/g, "$1 $2")
          colourParts = spaced.split(" ")
        }

        // Convert parts to sentence-case and deduplicate
        colourParts = colourParts.map(toSentenceCase)

        // Prefer English word if its Afrikaans twin is present
        let colour = colourParts[0] || ""
        colourParts.forEach(part => {
          const twinAfr = colourTwins[colour]
          if (twinAfr && part === twinAfr) {
            // already have english, skip afrikaans
          } else if (colourTwins[part]) {
            // part is english, prefer it
            colour = part
          } else if (Object.values(colourTwins).includes(part)) {
            // part is afrikaans and we don't have english yet
            colour = part
          }
        })

        colour = toSentenceCase(colour)

        // Description – normalize concatenated bilingual description
        // Raw: "TrucktractorVoorspanmotor" → "Truck tractor / Voorspanmotor"
        // Raw: "TipperWipbak" → "Tipper / Wipbak"
        const descriptionRaw = licenceArray[8] || ""
        let description = descriptionRaw

        if (descriptionRaw) {
          // Step 1: Add spaces between lowercase followed by uppercase
          // "TrucktractorVoorspanmotor" → "Trucktractor Voorspanmotor"
          const spaced = descriptionRaw.replace(/([a-z])([A-Z])/g, "$1 $2")

          // Step 2: Split on spaces or slashes to get individual words
          const words = spaced.split(/[\s/]+/).filter(Boolean)

          if (words.length >= 2) {
            // Step 3: Process each word - add internal spaces and capitalize properly
            const processedWords = words.map(word => {
              // Add spaces within compound words: "Trucktractor" → "Truck tractor"
              const wordSpaced = word.replace(/([a-z])([A-Z])/g, "$1 $2")
              // Capitalize: "Truck tractor" (proper case)
              return wordSpaced
                .split(/\s+/)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ")
            })

            // Step 4: Split into English (first half) and Afrikaans (second half)
            const midPoint = Math.ceil(processedWords.length / 2)
            const englishPart = processedWords.slice(0, midPoint).join(" ")
            const afrikaansPart = processedWords.slice(midPoint).join(" ")

            // Step 5: Join with " / " separator
            description = afrikaansPart ? `${englishPart} / ${afrikaansPart}` : englishPart
          } else {
            // Single word - just capitalize properly
            description = toSentenceCase(descriptionRaw)
          }
        }

        const result = {
          colour,
          dateOfExpiry: this.formatDateToDdMmYyyy(expiryDateObject),
          description,
          engineNo: licenceArray[13],
          expireDuration: expireStatusDuration,
          expireStatus: expiredStatus,
          identifier: licenceArray[7],
          identifierType: "vehicle",
          licenceDiskNo: licenceArray[5],
          licenceNo: licenceArray[6],
          make,
          model,
          vehicleReg: licenceArray[7],
          vin: licenceArray[12],
        }

        return result
      } else {
        return { error: "Not a Vehicle Licence Disc / Barcode does not contain enough data!" }
      } //end if (licenceArray.length > 14)
    } else {
      return { error: "Not a Vehicle Licence Disc!" }
    } //end if (raw.includes('%'))
  }

  private getPersonDescription(gender, age) {
    return gender + ", " + age + " YEARS OLD"
  }

  private getPersonAge(dateOfBirth: Date) {
    const ageDifMs = Date.now() - dateOfBirth.getTime()
    const ageDate = new Date(ageDifMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  private getPersonGender(gender) {
    if (gender == "M") return "MALE"
    if (gender == "F") return "FEMALE"
  }

  private getPersonDateOfBirth(idNumber: string): Date {
    const yearStr = idNumber.substring(0, 2)
    const monthStr = idNumber.substring(2, 4)
    const dayStr = idNumber.substring(4, 6)

    const snumYear = parseInt(yearStr, 10) // YY from ID e.g., 85 or 02
    let fullYear: number

    const currentActualYear = new Date().getFullYear()
    if (snumYear >= 0 && snumYear <= currentActualYear % 100) {
      fullYear = 2000 + snumYear
    } else {
      fullYear = 1900 + snumYear
    }

    const month = parseInt(monthStr, 10) // Month from ID is 1-indexed
    const day = parseInt(dayStr, 10)

    if (isNaN(fullYear) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 || fullYear < 1880 || fullYear > currentActualYear) {
      console.error(TAG, `getPersonDateOfBirth: Invalid date components Y:${fullYear}, M:${month}, D:${day} from ID "${idNumber}"`)
      return new Date(NaN)
    }
    // JavaScript Date constructor month is 0-indexed (0-11)
    return new Date(Date.UTC(fullYear, month - 1, day))
  }

  private getMonthDifference(startDate: Date, endDate: Date) {
    return endDate.getMonth() - startDate.getMonth() + 12 * (endDate.getFullYear() - startDate.getFullYear())
  }

  private formatDateToDdMmYyyy(date: Date): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      // console.warn(TAG, "formatDateToDdMmYyyy: Received invalid date", date)
      return "N/A"
    }
    const day = String(date.getUTCDate()).padStart(2, "0")
    const month = String(date.getUTCMonth() + 1).padStart(2, "0") // Month is 0-indexed
    const year = date.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  private parseDdMmmYyyyDate(dateString: string): Date {
    const parts = dateString.split(" ")
    if (parts.length !== 3) {
      console.error(TAG, `_parseDdMmmYyyyDate: Invalid date string format "${dateString}"`)
      return new Date(NaN) // Return an invalid date
    }

    const day = parseInt(parts[0], 10)
    const monthStr = parts[1].toUpperCase()
    const year = parseInt(parts[2], 10)

    const monthMap: { [key: string]: number } = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    }

    const month = monthMap[monthStr]

    // Basic validation for parsed components
    if (isNaN(day) || month === undefined || isNaN(year) || day < 1 || day > 31 || year < 1880 || year > new Date().getFullYear() + 5) {
      console.error(TAG, `parseDdMmmYyyyDate: Failed to parse components from "${dateString}". D:${day}, M:${monthStr}(${month}), Y:${year}`)
      return new Date(NaN) // Return an invalid date
    }
    return new Date(Date.UTC(year, month, day))
  }
}

export const scan = Scan.getInstance()
