"use client"

import { Button } from "@/components/ui/button"
import type { QueuePassenger } from "../types"
import type { Language } from "@/lib/translations"

interface QueuePassengerCardProps {
  passenger: QueuePassenger
  disabled: boolean
  language: Language
  t: Record<string, string>
  onAccept: (id: number) => void
  onReject: (id: number) => void
  onReturn: (id: number) => void
}

export function QueuePassengerCard({
  passenger,
  disabled,
  language,
  t,
  onAccept,
  onReject,
  onReturn,
}: QueuePassengerCardProps) {
  return (
    <div className="p-3 rounded-lg bg-secondary border border-border">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{passenger.name}</div>
          <div className="text-xs text-muted-foreground">
            {t.bookings}: {passenger.count}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onAccept(passenger.id)}
            size="sm"
            variant="default"
            disabled={disabled}
          >
            {t.accept}
          </Button>
          <Button
            onClick={() => onReject(passenger.id)}
            size="sm"
            variant="destructive"
            disabled={disabled}
          >
            {t.reject}
          </Button>
          <Button
            onClick={() => onReturn(passenger.id)}
            size="icon"
            variant="outline"
            disabled={disabled}
            title={language === "ru" ? "Вернуть" : "Return"}
          >
            ↩
          </Button>
        </div>
      </div>
    </div>
  )
}
