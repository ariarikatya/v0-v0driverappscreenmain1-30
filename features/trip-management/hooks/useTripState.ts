"use client"

import { useEffect, useRef, useState } from "react"
import { generateTripId } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  PRE_RACE_FSM_TRANSITIONS,
  TRIP_STATUS_TO_RACE_STATE,
  createRaceContext,
  getButtonConfig,
  logFSMEvent,
  validateTransition,
} from "@/lib/fsm-types"
import type { Language, translations as translationsObject } from "@/lib/translations"
import type { RaceState, PreRaceState } from "@/lib/fsm-types"
import type { RouteStop, StopHistory, UseTripStateReturn } from "../types"

const STATE = {
  PREP_IDLE: "PREP_IDLE",
  PREP_TIMER: "PREP_TIMER",
  BOARDING: "BOARDING",
  ROUTE_READY: "ROUTE_READY",
  IN_ROUTE: "IN_ROUTE",
  FINISHED: "FINISHED",
} as const

type TripStatus = (typeof STATE)[keyof typeof STATE]

export const tripRoutes: Record<string, { start: string; end: string; tariff: number; stops: RouteStop[] }> = {
  "247": {
    start: "Центр",
    end: "Вокзал",
    tariff: 350,
    stops: [
      { id: 0, name: "Центр", time: "14:00" },
      { id: 1, name: "пл. Ленина", time: "14:15" },
      { id: 2, name: "ТЦ Галерея", time: "14:45" },
      { id: 3, name: "Вокзал", time: "15:15" },
    ],
  },
  "248": {
    start: "Аэропорт",
    end: "Университет",
    tariff: 420,
    stops: [
      { id: 0, name: "Аэропорт", time: "10:00" },
      { id: 1, name: "пл. Революции", time: "10:20" },
      { id: 2, name: "пр. Победы", time: "10:40" },
      { id: 3, name: "Университет", time: "11:00" },
    ],
  },
  "249": {
    start: "Рынок",
    end: "Больница",
    tariff: 300,
    stops: [
      { id: 0, name: "Рынок", time: "08:00" },
      { id: 1, name: "ул. Мира", time: "08:20" },
      { id: 2, name: "Парк", time: "08:40" },
      { id: 3, name: "Больница", time: "09:00" },
    ],
  },
}

interface Seat {
  id: number
  status: "free" | "occupied"
  passengerName?: string
  fromStop?: number
  toStop?: number
  paymentMethod?: "cash" | "qr"
  amountPaid?: number
}

const INITIAL_SEATS: Seat[] = [
  {
    id: 1,
    status: "occupied",
    passengerName: "Иван П.",
    fromStop: 0,
    toStop: 3,
    paymentMethod: "qr",
    amountPaid: 450,
  },
  {
    id: 2,
    status: "occupied",
    passengerName: "Мария С.",
    fromStop: 0,
    toStop: 2,
    paymentMethod: "cash",
    amountPaid: 280,
  },
  { id: 3, status: "free" },
  { id: 4, status: "free" },
  {
    id: 5,
    status: "occupied",
    passengerName: "Алексей К.",
    fromStop: 0,
    toStop: 3,
    paymentMethod: "qr",
    amountPaid: 380,
  },
  { id: 6, status: "free" },
]

const DEFAULT_STOP_VOTING: UseTripStateReturn["stopVoting"] = {
  1: [
    { id: 1, timeLeft: 60, passengerCount: 2 },
    { id: 2, timeLeft: 60, passengerCount: 3 },
  ],
  2: [{ id: 1, timeLeft: 60, passengerCount: 1 }],
}

export function useTripState(initialLanguage: Language = "ru"): UseTripStateReturn {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const t = (translationsObject as any)[language] as Record<string, string>
  const { toast } = useToast()

  const [preRaceState, setPreRaceState] = useState<PreRaceState | null>("route_selection")
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0)
  const [visitedStops, setVisitedStops] = useState<Set<number>>(new Set())

  const [tripStatus, setTripStatus] = useState<TripStatus>(STATE.PREP_IDLE)
  const [tripId, setTripId] = useState<string>("")
  const [selectedTrip, setSelectedTrip] = useState<string>("")
  const [isDirectionReversed, setIsDirectionReversed] = useState(false)
  const [stops, setStops] = useState<RouteStop[]>([])
  const [prepareTimer, setPrepareTimer] = useState<number>(600)

  const [manualOccupied, setManualOccupied] = useState(0)
  const [isGeoTrackerActive, setIsGeoTrackerActive] = useState(false)
  const [areSeatsLocked, setAreSeatsLocked] = useState(true)
  const [seats, setSeats] = useState<Seat[]>(INITIAL_SEATS)

  const [stopHistoryMap, setStopHistoryMap] = useState<Map<number, StopHistory>>(new Map())
  const [stopVoting, setStopVoting] = useState(DEFAULT_STOP_VOTING)

  const [isStateLoaded, setIsStateLoaded] = useState(false)
  const scanInProgressRef = useRef(false)

  useEffect(() => {
    const savedState = localStorage.getItem("driverAppState")
    if (!savedState) {
      setIsStateLoaded(true)
      return
    }

    try {
      const parsed = JSON.parse(savedState)
      if (parsed.tripStatus) setTripStatus(parsed.tripStatus)
      if (parsed.tripId) setTripId(parsed.tripId)
      if (parsed.selectedTrip) setSelectedTrip(parsed.selectedTrip)
      if (parsed.isDirectionReversed !== undefined) setIsDirectionReversed(parsed.isDirectionReversed)
      if (parsed.currentStopIndex !== undefined) setCurrentStopIndex(parsed.currentStopIndex)
      if (parsed.manualOccupied !== undefined) setManualOccupied(parsed.manualOccupied)
      if (parsed.areSeatsLocked !== undefined) setAreSeatsLocked(parsed.areSeatsLocked)
      if (parsed.isGeoTrackerActive !== undefined) setIsGeoTrackerActive(parsed.isGeoTrackerActive)
      if (parsed.prepareTimer !== undefined) setPrepareTimer(parsed.prepareTimer)
      if (parsed.preRaceState !== undefined) setPreRaceState(parsed.preRaceState)
      if (parsed.visitedStops) setVisitedStops(new Set(parsed.visitedStops))
      if (parsed.stopHistoryMap) {
        const map = new Map<number, StopHistory>()
        for (const key in parsed.stopHistoryMap) {
          map.set(Number(key), parsed.stopHistoryMap[key])
        }
        setStopHistoryMap(map)
      }
      if (parsed.stopVoting) setStopVoting(parsed.stopVoting)
      if (parsed.stops) setStops(parsed.stops)
      console.log("[v0] State loaded successfully from localStorage")
    } catch (error) {
      console.error("Failed to load state, using defaults:", error)
    } finally {
      setIsStateLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!isStateLoaded) return

    if (
      tripStatus === STATE.PREP_IDLE &&
      !tripId &&
      prepareTimer === 600 &&
      selectedTrip === "" &&
      !isDirectionReversed
    ) {
      return
    }

    const stopHistoryObject: Record<number, StopHistory> = {}
    stopHistoryMap.forEach((value, key) => {
      stopHistoryObject[key] = value
    })

    const stateToSave = {
      tripStatus,
      tripId,
      selectedTrip,
      isDirectionReversed,
      currentStopIndex,
      manualOccupied,
      areSeatsLocked,
      isGeoTrackerActive,
      prepareTimer,
      visitedStops: Array.from(visitedStops),
      stopHistoryMap: stopHistoryObject,
      stops,
      stopVoting,
      preRaceState,
    }

    localStorage.setItem("driverAppState", JSON.stringify(stateToSave))
  }, [
    tripStatus,
    tripId,
    selectedTrip,
    isDirectionReversed,
    currentStopIndex,
    manualOccupied,
    areSeatsLocked,
    isGeoTrackerActive,
    prepareTimer,
    visitedStops,
    stopHistoryMap,
    stops,
    stopVoting,
    preRaceState,
    isStateLoaded,
  ])

  useEffect(() => {
    if (tripStatus !== STATE.PREP_TIMER) return

    const interval = setInterval(() => {
      setPrepareTimer((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [tripStatus])

  useEffect(() => {
    if (!selectedTrip) return
    const currentRoute = tripRoutes[selectedTrip]
    if (currentRoute) {
      setStops(isDirectionReversed ? [...currentRoute.stops].reverse() : currentRoute.stops)
    }
  }, [selectedTrip, isDirectionReversed])

  useEffect(() => {
    const actualOccupied = seats.filter((s) => s.status === "occupied").length
    setManualOccupied(actualOccupied)
  }, [seats])

  useEffect(() => {
    const interval = setInterval(() => {
      setStopVoting((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((stopId) => {
          updated[Number(stopId)] = updated[Number(stopId)]
            .map((voter) => ({ ...voter, timeLeft: voter.timeLeft - 1 }))
            .filter((voter) => voter.timeLeft > 0)
          if (updated[Number(stopId)].length === 0) {
            delete updated[Number(stopId)]
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handlePreRaceTransition = (action: "select_route" | "toggle_direction" | "confirm_route" | "start_preparation", newRouteId?: string) => {
    if (!preRaceState) return

    const transition = PRE_RACE_FSM_TRANSITIONS.find(
      (t) => t.from === preRaceState && t.action === action,
    )

    if (!transition) {
      logFSMEvent("fsm:pre_race_blocked", {
        oldState: preRaceState,
        action,
        reason: "invalid_transition",
      })
      return
    }

    logFSMEvent("fsm:pre_race_transition", {
      oldState: preRaceState,
      newState: transition.to,
      action,
      details: { routeId: newRouteId },
    })

    setPreRaceState(transition.to)

    if (action === "select_route" && newRouteId) {
      setSelectedTrip(newRouteId)
      const selectedRouteData = tripRoutes[newRouteId]
      if (selectedRouteData) {
        setStops(isDirectionReversed ? [...selectedRouteData.stops].reverse() : selectedRouteData.stops)
      }
    }

    if (action === "toggle_direction") {
      setIsDirectionReversed((prev) => {
        const next = !prev
        if (selectedTrip) {
          const currentRoute = tripRoutes[selectedTrip]
          if (currentRoute) {
            setStops([...stops].reverse())
          }
        }
        return next
      })
    }

    if (action === "start_preparation") {
      setPreRaceState(null)
    }
  }

  const startPreparation = () => {
    if (tripStatus !== STATE.PREP_IDLE) return

    setAreSeatsLocked(false)
    const newTripId = generateTripId()
    setTripId(newTripId)
    setTripStatus(STATE.PREP_TIMER)
    setPrepareTimer(600)
  }

  const cancelPreparation = () => {
    if (tripStatus !== STATE.PREP_TIMER) return

    setPreRaceState("ready_to_start")
    setIsGeoTrackerActive(false)
    setAreSeatsLocked(true)
    setPrepareTimer(600)
    setTripId("")
    setTripStatus(STATE.PREP_IDLE)

    toast({
      title: language === "ru" ? "Отменено" : "Cancelled",
      description: language === "ru" ? "Подготовка рейса отменена" : "Trip preparation cancelled",
    })
  }

  const startBoarding = (options: { freeSeats: number; occupiedSeats: number; hasActiveReservations: boolean; queueSize: number }) => {
    if (tripStatus !== STATE.PREP_TIMER) return

    const raceContext = createRaceContext({
      currentStopIndex,
      totalStops: stops.length,
      freeSeats: options.freeSeats,
      occupiedSeats: options.occupiedSeats,
      hasActiveReservations: options.hasActiveReservations,
      queueSize: options.queueSize,
      tripId,
    })

    const validation = validateTransition("RACE_WAITING_START", "start_boarding", raceContext)
    if (!validation.valid) {
      logFSMEvent("transition:blocked", {
        oldState: "RACE_WAITING_START",
        action: "start_boarding",
        details: { error: validation.error },
      })
      toast({
        title: t.error,
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    logFSMEvent("transition:success", {
      oldState: "RACE_WAITING_START",
      newState: validation.nextState,
      action: "start_boarding",
    })

    setIsGeoTrackerActive(true)
    setVisitedStops((prev) => new Set(prev).add(currentStopIndex))
    setTripStatus(STATE.BOARDING)
  }

  const readyForRoute = () => {
    if (tripStatus !== STATE.BOARDING) return

    setVisitedStops((prev) => new Set(prev).add(currentStopIndex))
    setAreSeatsLocked(true)
    setTripStatus(STATE.ROUTE_READY)
  }

  const startRoute = (options: { freeSeats: number; occupiedSeats: number; hasActiveReservations: boolean; queueSize: number }) => {
    if (tripStatus !== STATE.ROUTE_READY && tripStatus !== STATE.BOARDING) return

    const raceContext = createRaceContext({
      currentStopIndex,
      totalStops: stops.length,
      freeSeats: options.freeSeats,
      occupiedSeats: options.occupiedSeats,
      hasActiveReservations: options.hasActiveReservations,
      queueSize: options.queueSize,
      tripId,
    })

    const currentRaceState = TRIP_STATUS_TO_RACE_STATE[tripStatus]
    const action = currentRaceState === "RACE_BOARDING" ? "depart_stop" : "continue_boarding"

    const validation = validateTransition(currentRaceState, action, raceContext)

    if (!validation.valid) {
      logFSMEvent("transition:blocked", {
        oldState: currentRaceState,
        action,
        details: { error: validation.error },
      })
      toast({
        title: t.error,
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    logFSMEvent("transition:success", {
      oldState: currentRaceState,
      newState: validation.nextState,
      action,
    })

    setVisitedStops((prev) => new Set(prev).add(currentStopIndex))

    if (currentStopIndex + 1 >= stops.length - 1) {
      setCurrentStopIndex(stops.length - 1)
      setTripStatus(STATE.FINISHED)
    } else {
      setCurrentStopIndex(currentStopIndex + 1)
      setAreSeatsLocked(true)
      setTripStatus(STATE.IN_ROUTE)
    }
  }

  const arriveAtStop = (options: { freeSeats: number; occupiedSeats: number; hasActiveReservations: boolean; queueSize: number }) => {
    if (tripStatus !== STATE.IN_ROUTE) return

    const raceContext = createRaceContext({
      currentStopIndex,
      totalStops: stops.length,
      freeSeats: options.freeSeats,
      occupiedSeats: options.occupiedSeats,
      hasActiveReservations: options.hasActiveReservations,
      queueSize: options.queueSize,
      tripId,
    })

    const validation = validateTransition("RACE_IN_TRANSIT", "arrive_stop", raceContext)

    if (!validation.valid) {
      logFSMEvent("transition:blocked", {
        oldState: "RACE_IN_TRANSIT",
        action: "arrive_stop",
        details: { error: validation.error },
      })
      toast({
        title: t.error,
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    logFSMEvent("transition:success", {
      oldState: "RACE_IN_TRANSIT",
      newState: validation.nextState,
      action: "arrive_stop",
    })

    setVisitedStops((prev) => new Set(prev).add(currentStopIndex))

    setTripStatus(currentStopIndex === stops.length - 1 ? STATE.FINISHED : STATE.BOARDING)
    if (currentStopIndex !== stops.length - 1) {
      setAreSeatsLocked(false)
    }
  }

  const finishTrip = () => {
    if (tripStatus !== STATE.FINISHED) return
    setTripStatus(STATE.PREP_IDLE)
    setTripId("")
    setSelectedTrip("")
    setIsDirectionReversed(false)
    setCurrentStopIndex(0)
    setVisitedStops(new Set())
    setStopHistoryMap(new Map())
    setStopVoting(DEFAULT_STOP_VOTING)
    setManualOccupied(0)
    setIsGeoTrackerActive(false)
    setAreSeatsLocked(true)
    setPrepareTimer(600)
    setPreRaceState("route_selection")
  }

  const toggleDirection = () => {
    if (preRaceState === "direction_selection" || preRaceState === "route_confirmed") {
      handlePreRaceTransition("toggle_direction")
    }
  }

  const getRouteDisplayName = () => {
    if (!selectedTrip) return t.selectTrip
    const route = tripRoutes[selectedTrip]
    if (!route) return ""
    if (isDirectionReversed) {
      return `${route.end} → ${route.start}`
    }
    return `${route.start} → ${route.end}`
  }

  const formatTimer = (seconds: number) => {
    const isNegative = seconds < 0
    const absSeconds = Math.abs(seconds)
    const mins = Math.floor(absSeconds / 60)
    const secs = absSeconds % 60
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    return isNegative ? `-${timeStr}` : timeStr
  }

  const getTripButtonText = () => {
    const currentRaceState = TRIP_STATUS_TO_RACE_STATE[tripStatus]
    const buttonConfig = getButtonConfig(currentRaceState, language)

    if (tripStatus === STATE.PREP_TIMER) {
      return `${t.prepareTrip} ${formatTimer(prepareTimer)}`
    }

    if (tripStatus === STATE.BOARDING && currentStopIndex > 0) {
      return language === "ru" ? "Посадка завершена" : "Boarding Complete"
    }

    if (tripStatus === STATE.ROUTE_READY && currentStopIndex > 0) {
      return language === "ru" ? "Продолжить рейс" : "Continue Trip"
    }

    if (tripStatus === STATE.IN_ROUTE) {
      const stopName = stops[currentStopIndex]?.name || ""
      return language === "ru" ? `Прибыл ${stopName}` : `Arrived ${stopName}`
    }

    return buttonConfig.label
  }

  const getTripStatusEmoji = () => {
    if (tripStatus === STATE.IN_ROUTE) return "🚌"
    if (tripStatus === STATE.ROUTE_READY) return "🚦"
    if (tripStatus === STATE.BOARDING) return "👥"
    if (tripStatus === STATE.PREP_TIMER) return "⏱️"
    return "⏸️"
  }

  const canStartTrip = selectedTrip !== "" && tripStatus === STATE.PREP_IDLE
  const isPanelsDisabled = false

  return {
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
    seats,
    stopHistoryMap,
    stopVoting,
    preRaceState,

    setLanguage,
    setSeats,    setManualOccupied,    startPreparation,
    cancelPreparation,
    startBoarding,
    readyForRoute,
    startRoute,
    arriveAtStop,
    finishTrip,
    toggleDirection,
    selectRoute: (tripId: string) => handlePreRaceTransition("select_route", tripId),
    resetTrip: finishTrip,
    formatTimer,
    getTripButtonText,
    getTripStatusEmoji,
    canStartTrip,
    isPanelsDisabled,
  }
}

