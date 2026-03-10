export interface QueuePassenger {
  id: number
  name: string
  count: number
  orderNumber: number
  status: "waiting" | "accepted" | "rejected"
  scanned: boolean
  qrData?: {
    sum: number
    recipient: string
    created_at: string
  }
}

export interface UseQueueStateReturn {
  passengers: QueuePassenger[]
  currentScanningId: number | null
  totalPassengers: number
  acceptedPassengers: QueuePassenger[]
  addPassenger: (p: Omit<QueuePassenger, "id">) => void
  acceptPassenger: (id: number) => void
  rejectPassenger: (id: number) => void
  removePassenger: (id: number) => void
  startScanning: (id: number) => void
  confirmQR: (id: number, qrData: { sum: number; recipient: string; created_at: string }) => void
  updatePassengers: (passengers: QueuePassenger[]) => void
  clearQueue: () => void
}
