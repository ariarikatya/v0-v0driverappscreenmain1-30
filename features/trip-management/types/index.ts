import type { RaceState, PreRaceState } from '@/lib/fsm-types'

export interface RouteStop {
  id: number
  name: string
  time: string
}

export interface StopHistory {
  stopId: number
  reserved: number
  boarded: number
}

export interface Seat {
  id: number
  status: "free" | "occupied"
  passengerName?: string
  fromStop?: number
  toStop?: number
  paymentMethod?: "cash" | "qr"
  amountPaid?: number
}

export interface TripState {
  tripStatus: RaceState
  tripId: string
  selectedTrip: string
  currentStopIndex: number
  visitedStops: Set<number>
  prepareTimer: number
  isDirectionReversed: boolean
  stops: RouteStop[]
  isGeoTrackerActive: boolean
  areSeatsLocked: boolean
  manualOccupied: number
  seats: Seat[]
  stopHistoryMap: Map<number, StopHistory>
  stopVoting: Record<number, { id: number; timeLeft: number; passengerCount?: number }[]>
  preRaceState: PreRaceState | null
}

export interface UseTripStateReturn extends TripState {
  setLanguage: (lang: string) => void
  setSeats: (seats: Seat[]) => void
  startPreparation: () => void
  cancelPreparation: () => void
  startBoarding: (options: {
    freeSeats: number
    occupiedSeats: number
    hasActiveReservations: boolean
    queueSize: number
  }) => void
  readyForRoute: () => void
  startRoute: (options: {
    freeSeats: number
    occupiedSeats: number
    hasActiveReservations: boolean
    queueSize: number
  }) => void
  arriveAtStop: (options: {
    freeSeats: number
    occupiedSeats: number
    hasActiveReservations: boolean
    queueSize: number
  }) => void
  finishTrip: () => void
  toggleDirection: () => void
  selectRoute: (tripId: string) => void
  resetTrip: () => void
  formatTimer: (seconds: number) => string
  getTripButtonText: () => string
  getTripStatusEmoji: () => string
  canStartTrip: boolean
  isPanelsDisabled: boolean
}
