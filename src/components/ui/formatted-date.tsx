import { format, formatDistance, formatRelative } from "date-fns"

interface FormattedDateProps {
  date: Date | string | number
  formatType?: "short" | "long" | "relative" | "distance" | "custom"
  customFormat?: string
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * Reusable date formatting component
 * Handles various date formats consistently across the app
 */
export function FormattedDate({
  date,
  formatType = "short",
  customFormat,
  className = "text-sm text-muted-foreground",
  prefix,
  suffix,
}: FormattedDateProps) {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

  if (!dateObj || isNaN(dateObj.getTime())) {
    return <span className={className}>Invalid date</span>
  }

  let formattedDate: string

  switch (formatType) {
    case "short":
      formattedDate = dateObj.toLocaleDateString()
      break
    case "long":
      formattedDate = format(dateObj, "MMMM d, yyyy 'at' h:mm a")
      break
    case "relative":
      formattedDate = formatRelative(dateObj, new Date())
      break
    case "distance":
      formattedDate = formatDistance(dateObj, new Date(), { addSuffix: true })
      break
    case "custom":
      formattedDate = customFormat ? format(dateObj, customFormat) : dateObj.toLocaleDateString()
      break
    default:
      formattedDate = dateObj.toLocaleDateString()
  }

  return (
    <span className={className}>
      {prefix}
      {formattedDate}
      {suffix}
    </span>
  )
}

/**
 * Timestamp component for created/updated dates
 */
export function TimestampDisplay({ createdAt, updatedAt }: { createdAt?: Date | string | number; updatedAt?: Date | string | number }) {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      {createdAt && (
        <div>
          Created: <FormattedDate date={createdAt} formatType="distance" className="text-xs text-muted-foreground" />
        </div>
      )}
      {updatedAt && (
        <div>
          Updated: <FormattedDate date={updatedAt} formatType="distance" className="text-xs text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
