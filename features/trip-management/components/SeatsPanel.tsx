"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Language } from "@/lib/translations"

interface SeatsPanelProps {
  occupiedCount: number
  acceptedBookingsCount: number
  pendingBookingsCount: number
  freeCount: number
  totalCount: number
  manualOccupied: number
  setManualOccupied: (value: number) => void
  isPanelsDisabled: boolean
  t: Record<string, string>
  language: Language
}

export function SeatsPanel({
  occupiedCount,
  acceptedBookingsCount,
  pendingBookingsCount,
  freeCount,
  totalCount,
  manualOccupied,
  setManualOccupied,
  isPanelsDisabled,
  t,
  language,
}: SeatsPanelProps) {
  return (
    <div className={`p-4 border-2 border-border ${isPanelsDisabled ? "opacity-50 pointer-events-none" : ""}`}>
      <h2 className="text-lg font-bold text-foreground mb-4">{t.seats}</h2>
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-4 rounded-lg bg-secondary">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 bg-transparent flex-shrink-0"
              onClick={() => setManualOccupied(Math.max(0, manualOccupied - 1))}
              disabled={manualOccupied === 0 || isPanelsDisabled}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="text-2xl font-bold text-primary min-w-[2rem]">{occupiedCount}</div>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 bg-transparent flex-shrink-0"
              onClick={() => setManualOccupied(Math.min(6, manualOccupied + 1))}
              disabled={manualOccupied === 6 || isPanelsDisabled}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">{t.occupied}</div>
        </div>

        <div className="text-center p-4 rounded-lg bg-secondary">
          <div className="text-2xl font-bold text-blue-600">{acceptedBookingsCount}:{pendingBookingsCount}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.bookingsShort}</div>
        </div>

        <div className="text-center p-4 rounded-lg bg-secondary">
          <div className="text-2xl font-bold text-accent">{freeCount}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.free}</div>
        </div>

        <div className="text-center p-4 rounded-lg bg-secondary">
          <div className="text-2xl font-bold text-foreground">{totalCount}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.total}</div>
        </div>
      </div>
    </div>
  )
}
