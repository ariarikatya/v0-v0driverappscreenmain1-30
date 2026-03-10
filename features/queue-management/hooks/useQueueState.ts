"use client"

import { useEffect, useState } from "react"
import type { QueuePassenger, UseQueueStateReturn } from "../types"

const INITIAL_PASSENGERS: QueuePassenger[] = [
  {
    id: 1,
    name: "Петр С.",
    orderNumber: 1,
    count: 1,
    status: "waiting",
    scanned: false,
  },
  {
    id: 2,
    name: "Анна М.",
    orderNumber: 2,
    count: 2,
    status: "waiting",
    scanned: false,
  },
  {
    id: 3,
    name: "Игорь Л.",
    orderNumber: 3,
    count: 1,
    status: "waiting",
    scanned: false,
  },
  {
    id: 4,
    name: "Ольга К.",
    orderNumber: 4,
    count: 3,
    status: "waiting",
    scanned: false,
  },
  {
    id: 5,
    name: "Сергей Д.",
    orderNumber: 5,
    count: 1,
    status: "waiting",
    scanned: false,
  },
]

export function useQueueState(): UseQueueStateReturn {
  const [passengers, setPassengers] = useState<QueuePassenger[]>(INITIAL_PASSENGERS)
  const [currentScanningId, setCurrentScanningId] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("driverQueueState")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.passengers)) {
        setPassengers(parsed.passengers)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      "driverQueueState",
      JSON.stringify({ passengers }),
    )
  }, [passengers])

  const addPassenger = (p: Omit<QueuePassenger, "id">) => {
    setPassengers((prev) => [
      ...prev,
      { id: Date.now(), ...p },
    ])
  }

  const acceptPassenger = (id: number) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "accepted" } : p)),
    )
  }

  const rejectPassenger = (id: number) => {
    setPassengers((prev) => prev.filter((p) => p.id !== id))
  }

  const removePassenger = (id: number) => {
    setPassengers((prev) => prev.filter((p) => p.id !== id))
  }

  const startScanning = (id: number) => {
    setCurrentScanningId(id)
  }

  const confirmQR = (id: number, qrData: { sum: number; recipient: string; created_at: string }) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, scanned: true, qrData } : p)),
    )
    setCurrentScanningId(null)
  }

  const updatePassengers = (next: QueuePassenger[]) => {
    setPassengers(next)
  }

  const clearQueue = () => {
    setPassengers([])
    setCurrentScanningId(null)
  }

  const totalPassengers = passengers.length
  const acceptedPassengers = passengers.filter((p) => p.status === "accepted")

  return {
    passengers,
    currentScanningId,
    totalPassengers,
    acceptedPassengers,
    addPassenger,
    acceptPassenger,
    rejectPassenger,
    removePassenger,
    startScanning,
    confirmQR,
    updatePassengers,
    clearQueue,
  }
}
