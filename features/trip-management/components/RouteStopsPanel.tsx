"use client"

import { useMemo, useState } from "react"
import { Clock, User } from "lucide-react"
import type { Language } from "@/lib/translations"
import type { Booking } from "@/features/bookings/types"
import type { RouteStop, StopHistory } from "../types"
import { BookingCard } from "@/features/bookings/components/BookingCard"

interface RouteStopsPanelProps {
  selectedTrip: string
  stops: RouteStop[]
  currentStopIndex: number
  visitedStops: Set<number>
  stopHistoryMap: Map<number, StopHistory>
  stopVoting: Record<number, { id: number; timeLeft: number; passengerCount?: number }[]>
  bookings: Booking[]
  highlightedBookingId: number | null
  isPanelsDisabled: boolean
  freeCount: number
  acceptedBookingsCount: number
  language: Language
  t: Record<string, string>
  onReserveBooking: (bookingId: number) => void
  onAcceptBooking: (bookingId: number) => void
  onAcceptBookingQR: (bookingId: number) => void
  onRejectBooking: (bookingId: number) => void
  onRejectBookingQR: (bookingId: number) => void
  onReturnBooking: (bookingId: number) => void
  onCancelBooking: (bookingId: number, isOnCurrentStop: boolean) => void
}

export function RouteStopsPanel({
  selectedTrip,
  stops,
  currentStopIndex,
  visitedStops,
  stopHistoryMap,
  stopVoting,
  bookings,
  highlightedBookingId,
  isPanelsDisabled,
  freeCount,
  acceptedBookingsCount,
  language,
  t,
  onReserveBooking,
  onAcceptBooking,
  onAcceptBookingQR,
  onRejectBooking,
  onRejectBookingQR,
  onReturnBooking,
  onCancelBooking,
}: RouteStopsPanelProps) {
  const [showStopHistory, setShowStopHistory] = useState(false)


  const stopItems = useMemo(() => {
    return stops
      .slice(showStopHistory ? 0 : currentStopIndex, -1)
      .map((stop) => {
        const stopBookings = bookings.filter((b) => b.fromStopIndex === stop.id)
        const historyBoarded = stopBookings
          .filter((b) => b.scanned)
          .reduce((sum, b) => sum + (b.passengerCount || b.count || 1), 0)
        const historyReserved = stopBookings
          .filter((b) => !b.scanned)
          .reduce((sum, b) => sum + (b.passengerCount || b.count || 1), 0)

        const visibleBookings = stopBookings.filter((b) => {
          return !b.scanned && (b.reserved || freeCount >= (b.count || 1))
        })

        const isPastStop = visitedStops.has(stop.id) && stop.id < currentStopIndex

        if (stop.id === 0 && stopBookings.length === 0) return null
        if (stop.id === stops[stops.length - 1].id) return null
        if (!isPastStop && stopBookings.length === 0) return null

        return {
          stop,
          stopBookings,
          historyBoarded,
          historyReserved,
          visibleBookings,
          isPastStop,
        }
      })
      .filter(Boolean) as Array<{
      stop: RouteStop
      stopBookings: Booking[]
      historyBoarded: number
      historyReserved: number
      visibleBookings: Booking[]
      isPastStop: boolean
    }>
  }, [bookings, freeCount, showStopHistory, stops, visitedStops, currentStopIndex])

  return (
    <div className={`p-4 border-2 border-border ${isPanelsDisabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">{t.stops}</h2>
        {currentStopIndex > 1 && visitedStops.size > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStopHistory(!showStopHistory)}
          >
            {showStopHistory
              ? language === "ru"
                ? "Скрыть историю"
                : "Hide history"
              : language === "ru"
              ? "Показать историю"
              : "Show history"}
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {stopItems.map(({ stop, stopBookings, historyBoarded, historyReserved, visibleBookings, isPastStop }) => (
          <div key={stop.id} className={isPastStop ? "opacity-50" : ""}>
            <div className="flex items-start gap-3 py-2">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center gap-1">
                  {isPastStop && <span className="text-xs mr-1">✓</span>}
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">{stop.time}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-base text-foreground">{stop.name}</h3>
                    {isPastStop && (
                      <div className="text-xs text-muted-foreground mt-1 font-medium">
                        {(() => {
                          const history = stopHistoryMap.get(stop.id)
                          if (history) {
                            return language === "ru"
                              ? `Зарезервировано: ${history.reserved}, Посажено: ${history.boarded}`
                              : `Reserved: ${history.reserved}, Boarded: ${history.boarded}`
                          }
                          return language === "ru"
                            ? `Зарезервировано: ${historyReserved}, Посажено: ${historyBoarded}`
                            : `Reserved: ${historyReserved}, Boarded: ${historyBoarded}`
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {visibleBookings.length > 0 && !isPastStop && (
                  <div className="space-y-2 mt-3">
                    {visibleBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        language={language}
                        t={t}
                        isDisabled={isPanelsDisabled}
                        highlighted={highlightedBookingId === booking.id}
                        onReserve={onReserveBooking}
                        onAccept={onAcceptBooking}
                        onAcceptQR={onAcceptBookingQR}
                        onReject={onRejectBooking}
                        onRejectQR={onRejectBookingQR}
                        onReturn={onReturnBooking}
                        onCancel={(id, isOnCurrentStop) => onCancelBooking(id, isOnCurrentStop)}
                        isOnCurrentStop={stop.id === currentStopIndex}
                      />
                    ))}
                  </div>
                )}

                {stopVoting[stop.id] && stopVoting[stop.id].length > 0 && !isPastStop && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                          {language === "ru" ? "Голосуют:" : "Voting:"} {stopVoting[stop.id].length} ({
                          stopVoting[stop.id].reduce((sum, v) => sum + (v.passengerCount || 1), 0)
                        })
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stopVoting[stop.id].map((voter) => (
                        <div
                          key={voter.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-100 dark:bg-amber-800 border border-amber-300 dark:border-amber-700"
                        >
                          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-mono font-semibold text-amber-900 dark:text-amber-100">
                            0:{String(voter.timeLeft).padStart(2, "0")} ({voter.passengerCount || 1})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {visibleBookings.length === 0 && !isPastStop && stopBookings.length > 0 && (
                  <div className="text-xs text-muted-foreground italic mt-2">
                    {language === "ru" ? "Нет свободных мест для новых броней" : "No free seats for new bookings"}
                  </div>
                )}
              </div>
            </div>

            {/** connector */}
            <div className="ml-2">
              <div className="w-px h-8 bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
