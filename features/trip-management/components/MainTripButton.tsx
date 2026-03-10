"use client"

import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GeoTrackerIndicator } from "@/components/geo-tracker-indicator"
import type { Language } from "@/lib/translations"
import type { RouteStop } from "../types"

interface MainTripButtonProps {
  tripStatus: string
  currentStopIndex: number
  stops: RouteStop[]
  userStatus: "pending" | "approved" | "confirmed"
  language: Language
  t: Record<string, string>
  getTripButtonText: () => string
  canStartTrip: boolean
  onMainButtonClick: () => void
  onCancelPreparation: () => void
  onToggleDirection: () => void
  isGeoTrackerActive: boolean
}

export function MainTripButton({
  tripStatus,
  currentStopIndex,
  stops,
  userStatus,
  language,
  t,
  getTripButtonText,
  canStartTrip,
  onMainButtonClick,
  onCancelPreparation,
  onToggleDirection,
  isGeoTrackerActive,
}: MainTripButtonProps) {
  const isConfirmed = userStatus === "confirmed"

  return (
    <div className="flex items-center gap-2 w-full">
      <Button
        onClick={() => {
          if (!isConfirmed) return
          onMainButtonClick()
        }}
        disabled={tripStatus === "PREP_IDLE" && !canStartTrip}
        className="flex-1"
        size="lg"
      >
        {getTripButtonText()}
      </Button>

      {tripStatus === "PREP_IDLE" && (
        <Button
          variant="outline"
          size="lg"
          onClick={onToggleDirection}
          disabled={!canStartTrip}
          className="px-4 bg-transparent"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </Button>
      )}

      {tripStatus === "PREP_TIMER" && (
        <Button
          variant="outline"
          size="lg"
          onClick={onCancelPreparation}
          className="whitespace-nowrap bg-transparent"
        >
          {language === "ru" ? "Отмена" : "Cancel"}
        </Button>
      )}

      {(tripStatus === "BOARDING" || tripStatus === "ROUTE_READY" || tripStatus === "IN_ROUTE") && (
        <div className="flex flex-col items-end gap-1">
          {tripStatus === "ROUTE_READY" && currentStopIndex > 0 && (
            <span className="text-xs text-muted-foreground font-medium">{stops[currentStopIndex]?.name}</span>
          )}
          <GeoTrackerIndicator isActive={isGeoTrackerActive} language={language} />
        </div>
      )}
    </div>
  )
}
