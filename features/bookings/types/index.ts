export interface Booking {
  id: number
  passengerName: string
  phone?: string
  pickupTime?: string
  pickupLocation?: string
  fromStopIndex: number
  toStopIndex: number
  count: number
  amount: number
  accepted?: boolean
  reserved?: boolean
  cancelled?: boolean
  scanned?: boolean
  qrError?: boolean | string
  showQRButtons?: boolean
  qrData?: {
    sum: number
    recipient: string
    created_at: string
  }
  passengerCount?: number
  cancelContext?: "boarding" | "future_stop"
}

export interface UseBookingsStateReturn {
  bookings: Booking[]
  totalBookings: number
  acceptedBookings: Booking[]
  pendingBookings: Booking[]
  cancelBookingId: number | null
  cancelReason: string
  setCancelReason: (reason: string) => void
  highlightedBookingId: number | null
  setHighlightedBookingId: (id: number | null) => void
  addBooking: (b: Omit<Booking, "id">) => void
  acceptBooking: (id: number) => void
  rejectBooking: (id: number) => void
  reserveBooking: (id: number) => void
  startCancellation: (id: number, context: string) => void
  updateBooking: (id: number, changes: Partial<Booking>) => void
  confirmCancellation: () => void
}
