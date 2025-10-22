"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export interface OperatingHours {
  monday: { open: string; close: string }
  tuesday: { open: string; close: string }
  wednesday: { open: string; close: string }
  thursday: { open: string; close: string }
  friday: { open: string; close: string }
  saturday: { open: string; close: string }
  sunday: { open: string; close: string }
}

interface OperatingHoursEditorProps {
  value: OperatingHours
  onChange: (hours: OperatingHours) => void
  disabled?: boolean
}

const DAYS: Array<keyof OperatingHours> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const DAY_LABELS: Record<keyof OperatingHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export function OperatingHoursEditor({ value, onChange, disabled = false }: OperatingHoursEditorProps) {
  const updateDay = (day: keyof OperatingHours, field: "open" | "close", newValue: string) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: newValue,
      },
    })
  }

  const setClosed = (day: keyof OperatingHours) => {
    onChange({
      ...value,
      [day]: { open: "closed", close: "closed" },
    })
  }

  const set24Hours = (day: keyof OperatingHours) => {
    onChange({
      ...value,
      [day]: { open: "00:00", close: "23:59" },
    })
  }

  const isClosed = (day: keyof OperatingHours) => {
    return value[day].open === "closed" || value[day].close === "closed"
  }

  const is24Hours = (day: keyof OperatingHours) => {
    return value[day].open === "00:00" && value[day].close === "23:59"
  }

  return (
    <div className="space-y-4">
      <Label>Operating Hours *</Label>
      <div className="border rounded-md p-4 space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-3">
              <Label className="text-sm">{DAY_LABELS[day]}</Label>
            </div>
            <div className="col-span-3">
              <Input
                type="time"
                value={isClosed(day) ? "" : value[day].open}
                onChange={(e) => updateDay(day, "open", e.target.value)}
                disabled={disabled || isClosed(day)}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-3">
              <Input
                type="time"
                value={isClosed(day) ? "" : value[day].close}
                onChange={(e) => updateDay(day, "close", e.target.value)}
                disabled={disabled || isClosed(day)}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <div className="flex items-center space-x-1">
                <Checkbox
                  id={`${day}-closed`}
                  checked={isClosed(day)}
                  disabled={disabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setClosed(day)
                    } else {
                      // Set to default hours when unchecked
                      onChange({
                        ...value,
                        [day]: { open: "06:00", close: "18:00" },
                      })
                    }
                  }}
                />
                <Label htmlFor={`${day}-closed`} className="text-xs cursor-pointer">
                  Closed
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <Checkbox
                  id={`${day}-24h`}
                  checked={is24Hours(day)}
                  disabled={disabled || isClosed(day)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      set24Hours(day)
                    } else {
                      // Set to default hours when unchecked
                      onChange({
                        ...value,
                        [day]: { open: "06:00", close: "18:00" },
                      })
                    }
                  }}
                />
                <Label htmlFor={`${day}-24h`} className="text-xs cursor-pointer">
                  24h
                </Label>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Default: 06:00-18:00 (Mon-Fri), 06:00-14:00 (Sat), Closed (Sun)
      </p>
    </div>
  )
}
