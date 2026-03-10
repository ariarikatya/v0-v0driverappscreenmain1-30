"use client"

import { useEffect, useState } from "react"
import type { Booking, UseBookingsStateReturn } from "../types"

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 1,
    passengerName: "Ольга В.",
    pickupTime: "14:15",
    pickupLocation: "пл. Ленина",
    fromStopIndex: 1,
    toStopIndex: 3,
    amount: 320,
    count: 1,
    passengerCount: 1,
  },
  {
    id: 2,
    passengerName: "Дмитрий Н.",
    pickupTime: "14:15",
    pickupLocation: "пл. Ленина",
    fromStopIndex: 1,
    toStopIndex: 3,
    amount: 320,
    count: 2,
    passengerCount: 1,
  },
  {
    id: 3,
    passengerName: "Елена Т.",
    pickupTime: "14:45",
    pickupLocation: "ТЦ Галерея",
    fromStopIndex: 2,
    toStopIndex: 3,
    amount: 180,
    count: 1,
    passengerCount: 1,
  },
]

export function useBookingsState(): UseBookingsStateReturn {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS)
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState<string>("")
  const [highlightedBookingId, setHighlightedBookingId] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("driverBookingsState")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.bookings)) {
        setBookings(parsed.bookings)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("driverBookingsState", JSON.stringify({ bookings }))
  }, [bookings])

  const addBooking = (b: Omit<Booking, "id">) => {
    setBookings((prev) => [...prev, { id: Date.now(), ...b }])
  }

  const acceptBooking = (id: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              accepted: true,
              reserved: true,
            }
          : b,
      ),
    )
  }

  const rejectBooking = (id: number) => {
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }

  const reserveBooking = (id: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              reserved: true,
              accepted: true,
            }
          : b,
      ),
    )
  }

  const updateBooking = (id: number, changes: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)))
  }

  const startCancellation = (id: number, context: string) => {
    setCancelBookingId(id)
    setCancelReason("")
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              cancelContext: context as "boarding" | "future_stop",
            }
          : b,
      ),
    )
  }

  const confirmCancellation = () => {
    if (!cancelBookingId || !cancelReason) return
    setBookings((prev) => prev.filter((b) => b.id !== cancelBookingId))
    setCancelBookingId(null)
    setCancelReason("")
  }

  const totalBookings = bookings.length
  const acceptedBookings = bookings.filter((b) => b.accepted)
  const pendingBookings = bookings.filter((b) => !b.accepted)

  return {
    bookings,
    totalBookings,
    acceptedBookings,
    pendingBookings,
    cancelBookingId,
    cancelReason,
    setCancelReason,
    highlightedBookingId,
    setHighlightedBookingId,
    addBooking,
    acceptBooking,
    rejectBooking,
    reserveBooking,
    updateBooking,
    startCancellation,
    confirmCancellation,
  }
}
