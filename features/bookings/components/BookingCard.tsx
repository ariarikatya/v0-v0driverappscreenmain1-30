"use client"

import { QrCode, Undo2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Booking } from "../types"
import type { Language } from "@/lib/translations"

interface BookingCardProps {
  booking: Booking
  language: Language
  t: Record<string, string>
  isDisabled: boolean
  highlighted: boolean
  onReserve: (id: number) => void
  onAccept: (id: number) => void
  onAcceptQR: (id: number) => void
  onReject: (id: number) => void
  onRejectQR: (id: number) => void
  onReturn: (id: number) => void
  onCancel: (id: number, isOnCurrentStop: boolean) => void
  isOnCurrentStop: boolean
}

export function BookingCard({
  booking,
  language,
  t,
  isDisabled,
  highlighted,
  onReserve,
  onAccept,
  onAcceptQR,
  onReject,
  onRejectQR,
  onReturn,
  onCancel,
  isOnCurrentStop,
}: BookingCardProps) {
  return (
    <div
      className={`p-3 rounded-lg bg-secondary border ${
        highlighted
          ? "border-green-500 ring-2 ring-green-500/50 bg-green-50 dark:bg-green-900/20"
          : booking.qrError
          ? "border-red-500"
          : booking.reserved
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          {booking.qrError && <X className="h-4 w-4 text-red-500" />}
          {booking.reserved && <span className="text-xs">✓</span>}
          {booking.passengerName}
        </h4>
        <span className="text-xs text-muted-foreground font-semibold">
          {booking.count} {t.bookings}
        </span>
      </div>

      {booking.qrError && (
        <div className="space-y-2">
          <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive">{booking.qrError}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onRejectQR(booking.id)}
              className="flex-1 h-9 text-sm font-semibold"
              variant="destructive"
              size="sm"
              disabled={isDisabled}
            >
              {t.reject}
            </Button>
            <Button
              onClick={() => onReturn(booking.id)}
              className="h-9 w-9"
              variant="outline"
              size="icon"
              title={language === "ru" ? "Вернуть" : "Return"}
              disabled={isDisabled}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!booking.qrError && booking.showQRButtons && booking.qrData && (
        <div>
          <div className="flex gap-2">
            <Button
              onClick={() => onAcceptQR(booking.id)}
              className="flex-1 h-9 text-sm font-semibold"
              variant="default"
              size="sm"
              disabled={isDisabled}
            >
              {t.accept}
            </Button>
            <Button
              onClick={() => onRejectQR(booking.id)}
              className="flex-1 h-9 text-sm font-semibold"
              variant="destructive"
              size="sm"
              disabled={isDisabled}
            >
              {t.reject}
            </Button>
            <Button
              onClick={() => onReturn(booking.id)}
              className="h-9 w-9"
              variant="outline"
              size="icon"
              title={language === "ru" ? "Вернуть" : "Return"}
              disabled={isDisabled}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!booking.qrError && !booking.showQRButtons && !booking.reserved && (
        <div className="flex gap-2">
          <Button
            onClick={() => onReserve(booking.id)}
            className="flex-1 h-9 text-sm font-semibold"
            variant="default"
            size="sm"
            disabled={isDisabled}
          >
            {language === "ru" ? "Взять" : "Reserve"}
          </Button>
          <Button
            onClick={() => onCancel(booking.id, isOnCurrentStop)}
            className="h-9 w-auto px-3 text-sm font-semibold"
            variant="outline"
            size="sm"
            disabled={isDisabled}
            style={{ backgroundColor: "#fbbf24", borderColor: "#fbbf24" }}
          >
            {language === "ru" ? "Отменить" : "Cancel"}
          </Button>
        </div>
      )}

      {!booking.qrError && !booking.showQRButtons && booking.reserved && (
        <div className="flex gap-2">
          <Button
            onClick={() => onAccept(booking.id)}
            className="flex-1 h-9 text-sm font-semibold"
            variant="default"
            size="sm"
            disabled={isDisabled || !isOnCurrentStop}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {t.scanQR}
          </Button>
          <Button
            onClick={() => onCancel(booking.id, isOnCurrentStop)}
            className="h-9 w-auto px-3 text-sm font-semibold"
            variant="outline"
            size="sm"
            disabled={isDisabled}
            style={{ backgroundColor: "#fbbf24", borderColor: "#fbbf24" }}
          >
            {language === "ru" ? "Отменить" : "Cancel"}
          </Button>
        </div>
      )}
    </div>
  )
}
