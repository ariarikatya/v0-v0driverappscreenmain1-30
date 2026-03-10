"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { CashQRDialog } from "@/components/cash-qr-dialog"
import { getPanelVisibility, TRIP_STATUS_TO_RACE_STATE } from "@/lib/fsm-types"
import type { Language } from "@/lib/translations"
import { useBookingsState } from "@/features/bookings/hooks/useBookingsState"
import { BookingCancelDialog } from "@/features/bookings/components/BookingCancelDialog"
import { usePaymentsState } from "@/features/payments/hooks/usePaymentsState"
import { useQueueState } from "@/features/queue-management/hooks/useQueueState"
import { QueuePanel } from "@/features/queue-management/components/QueuePanel"
import { tripRoutes, useTripState } from "../hooks/useTripState"
import { MainTripButton } from "./MainTripButton"
import { RouteStopsPanel } from "./RouteStopsPanel"
import { SeatsPanel } from "./SeatsPanel"
import { TripHeader } from "./TripHeader"

interface DriverDashboardProps {
  language: Language
  t: Record<string, string>
  userStatus: "pending" | "confirmed" | "approved"
  onLogout: () => void
  onLanguageChange: (language: Language) => void
}

export function DriverDashboard({
  language,
  t,
  userStatus,
  onLogout,
  onLanguageChange,
}: DriverDashboardProps) {
  const { toast } = useToast()

  const {
    tripStatus,
    tripId,
    selectedTrip,
    currentStopIndex,
    visitedStops,
    prepareTimer,
    isDirectionReversed,
    stops,
    isGeoTrackerActive,
    areSeatsLocked,
    manualOccupied,
    stopHistoryMap,
    stopVoting,
    setLanguage,
    setManualOccupied,
    startPreparation,
    cancelPreparation,
    startBoarding,
    readyForRoute,
    startRoute,
    arriveAtStop,
    finishTrip,
    toggleDirection,
    selectRoute,
    formatTimer,
    getTripButtonText,
    getTripStatusEmoji,
    canStartTrip: tripCanStart,
  } = useTripState(language)

  const {
    bookings,
    totalBookings,
    acceptedBookings,
    pendingBookings,
    cancelBookingId,
    cancelReason,
    setCancelReason,
    highlightedBookingId,
    setHighlightedBookingId,
    acceptBooking,
    rejectBooking,
    reserveBooking,
    updateBooking,
    startCancellation,
    confirmCancellation,
  } = useBookingsState()

  const {
    passengers,
    acceptPassenger,
    rejectPassenger,
    addPassenger,
    removePassenger,
    updatePassengers: setQueuePassengers,
  } = useQueueState()

  const { paymentFSM, setPaymentFSM } = usePaymentsState()

  const [showCashQRDialog, setShowCashQRDialog] = useState(false)
  const [tempBookingId, setTempBookingId] = useState<number | null>(null)

  const occupiedCount = manualOccupied
  const acceptedBookingsCount = acceptedBookings.length
  const pendingBookingsCount = pendingBookings.length
  const freeCount = Math.max(0, 6 - occupiedCount - acceptedBookingsCount)
  const totalSeats = 6

  const isPanelsDisabled = userStatus !== "confirmed" || areSeatsLocked

  const currentRaceState = TRIP_STATUS_TO_RACE_STATE[tripStatus]

  const panelVisibility = getPanelVisibility(currentRaceState, {
    currentStopIndex,
    totalStops: stops.length,
    hasActiveReservations: acceptedBookingsCount > 0,
    queueSize: passengers.length,
  })

  const handleMainButtonClick = () => {
    switch (tripStatus) {
      case "PREP_IDLE":
        startPreparation()
        break
      case "PREP_TIMER":
        cancelPreparation()
        break
      case "BOARDING":
        startBoarding({
          freeSeats: freeCount,
          occupiedSeats: occupiedCount,
          hasActiveReservations: acceptedBookingsCount > 0,
          queueSize: passengers.length,
        })
        break
      case "ROUTE_READY":
        startRoute({
          freeSeats: freeCount,
          occupiedSeats: occupiedCount,
          hasActiveReservations: acceptedBookingsCount > 0,
          queueSize: passengers.length,
        })
        break
      case "IN_ROUTE":
        arriveAtStop({
          freeSeats: freeCount,
          occupiedSeats: occupiedCount,
          hasActiveReservations: acceptedBookingsCount > 0,
          queueSize: passengers.length,
        })
        break
      case "FINISHED":
        finishTrip()
        break
      default:
        break
    }
  }

  const handleSelectRoute = (routeId: string) => {
    if (tripStatus !== "PREP_IDLE") return
    selectRoute(routeId)
  }

  const handleToggleDirection = () => {
    toggleDirection()
  }

  const handleAcceptBooking = (id: number) => {
    acceptBooking(id)
    setHighlightedBookingId(id)
  }

  const handleReserveBooking = (id: number) => {
    reserveBooking(id)
    setHighlightedBookingId(id)
  }

  const handleRejectBooking = (id: number) => {
    rejectBooking(id)
    setHighlightedBookingId(null)
  }

  const handleReturnBooking = (id: number) => {
    updateBooking(id, { scanned: false, qrError: false, qrData: undefined })
    setHighlightedBookingId(null)
  }

  const handleCancelBooking = (id: number, isOnCurrentStop: boolean) => {
    const context = isOnCurrentStop ? "boarding" : "future_stop"
    startCancellation(id, context)
  }

  const handleScanBooking = (id: number) => {
    setTempBookingId(id)
    setShowCashQRDialog(true)
  }

  const handleConfirmQR = () => {
    if (tempBookingId) {
      updateBooking(tempBookingId, {
        scanned: true,
        qrError: false,
        qrData: {
          sum: 320,
          recipient: language === "ru" ? "Водитель Иванов И.И." : "Driver Ivanov I.",
          created_at: new Date().toISOString(),
        },
      })
      setHighlightedBookingId(tempBookingId)
    }
    setTempBookingId(null)

    setPaymentFSM({
      state: "paid",
      context: {
        paymentType: "cash",
        amount: 320,
      },
    })
  }

  const handleInvalidQR = () => {
    if (tempBookingId) {
      updateBooking(tempBookingId, {
        qrError: language === "ru" ? "QR код не подходит" : "QR code mismatch",
      })
      setHighlightedBookingId(tempBookingId)
    }
  }

  const closeCashQRDialog = () => {
    setShowCashQRDialog(false)
    setTempBookingId(null)
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    onLanguageChange(lang)
  }

  const canStartTrip = tripCanStart && userStatus === "confirmed"

  const bookingToCancel = bookings.find((b) => b.id === cancelBookingId)
  const cancelContext = bookingToCancel?.cancelContext ?? "boarding"

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <TripHeader
        selectedTrip={selectedTrip}
        tripStatus={tripStatus}
        isDirectionReversed={isDirectionReversed}
        isRouteDropdownDisabled={tripStatus !== "PREP_IDLE"}
        userStatus={userStatus}
        language={language}
        t={t}
        tripId={tripId}
        routeData={tripRoutes}
        getRouteDisplayName={() => {
          if (!selectedTrip) return t.selectTrip
          const route = tripRoutes[selectedTrip]
          if (!route) return ""
          return isDirectionReversed ? `${route.end} → ${route.start}` : `${route.start} → ${route.end}`
        }}
        getTripStatusEmoji={getTripStatusEmoji}
        onSelectRoute={handleSelectRoute}
        onToggleDirection={handleToggleDirection}
        onLogout={onLogout}
        onNavigateToBalance={() => {
          if (userStatus !== "confirmed") {
            toast({
              title: t.error,
              description: language === "ru" ? "Аккаунт не подтвержден" : "Account not confirmed",
              variant: "destructive",
            })
          }
        }}
      />

      <div className="px-2 pt-4 space-y-6">
        <div className="bg-card border-2 border-border p-4 rounded-lg">
          <MainTripButton
            tripStatus={tripStatus}
            currentStopIndex={currentStopIndex}
            stops={stops}
            userStatus={userStatus}
            language={language}
            t={t}
            getTripButtonText={getTripButtonText}
            canStartTrip={canStartTrip}
            onMainButtonClick={handleMainButtonClick}
            onCancelPreparation={cancelPreparation}
            onToggleDirection={handleToggleDirection}
            isGeoTrackerActive={isGeoTrackerActive}
          />
        </div>

        {selectedTrip && panelVisibility.cash !== "hidden" && (
          <SeatsPanel
            occupiedCount={occupiedCount}
            acceptedBookingsCount={acceptedBookingsCount}
            pendingBookingsCount={pendingBookingsCount}
            freeCount={freeCount}
            totalCount={totalSeats}
            manualOccupied={manualOccupied}
            setManualOccupied={setManualOccupied}
            isPanelsDisabled={isPanelsDisabled}
            t={t}
            language={language}
          />
        )}

        {selectedTrip && panelVisibility.queue !== "hidden" && freeCount > 0 && (
          <QueuePanel
            passengers={passengers}
            onUpdate={setQueuePassengers}
            onAccept={acceptPassenger}
            onReject={rejectPassenger}
            onReturn={removePassenger}
            disabled={isPanelsDisabled}
            language={language}
            t={t}
          />
        )}

        {selectedTrip && tripStatus === "BOARDING" && currentStopIndex < stops.length - 1 && (
          <RouteStopsPanel
            selectedTrip={selectedTrip}
            stops={stops}
            currentStopIndex={currentStopIndex}
            visitedStops={visitedStops}
            stopHistoryMap={stopHistoryMap}
            stopVoting={stopVoting}
            bookings={bookings}
            highlightedBookingId={highlightedBookingId}
            isPanelsDisabled={isPanelsDisabled}
            freeCount={freeCount}
            acceptedBookingsCount={acceptedBookingsCount}
            language={language}
            t={t}
            onReserveBooking={handleReserveBooking}
            onAcceptBooking={handleAcceptBooking}
            onAcceptBookingQR={handleScanBooking}
            onRejectBooking={handleRejectBooking}
            onRejectBookingQR={handleRejectBooking}
            onReturnBooking={handleReturnBooking}
            onCancelBooking={handleCancelBooking}
          />
        )}
      </div>

      <CashQRDialog
        open={showCashQRDialog}
        onOpenChange={(open) => {
          if (!open) {
            closeCashQRDialog()
          }
        }}
        driverName={language === "ru" ? "Водитель Иванов И.И." : "Driver Ivanov I."}
        amount={320}
        currency="RUB"
        onConfirm={handleConfirmQR}
        onInvalid={handleInvalidQR}
        language={language}
        showNotFoundButton={true}
      />

      <BookingCancelDialog
        open={Boolean(cancelBookingId)}
        onClose={() => {
          setCancelReason("")
        }}
        onConfirm={() => {
          confirmCancellation()
        }}
        bookingPassengerName={bookingToCancel?.passengerName}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        language={language}
        t={t}
      />
    </div>
  )
}
