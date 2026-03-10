"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Language } from "@/lib/translations"

interface BookingCancelDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  bookingPassengerName?: string
  cancelReason: string
  setCancelReason: (reason: string) => void
  language: Language
  t: Record<string, string>
}

export function BookingCancelDialog({
  open,
  onClose,
  onConfirm,
  bookingPassengerName,
  cancelReason,
  setCancelReason,
  language,
  t,
}: BookingCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === "ru" ? "Отменить бронь" : "Cancel Booking"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {language === "ru"
              ? "Пожалуйста, укажите причину отмены брони для отчета."
              : "Please provide a reason for canceling the booking for reporting."}
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t.reason}</label>
            <input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={language === "ru" ? "Причина отмены" : "Cancellation reason"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === "ru" ? "Отмена" : "Cancel"}
          </Button>
          <Button onClick={onConfirm} disabled={!cancelReason.trim()}>
            {language === "ru" ? "Подтвердить" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
