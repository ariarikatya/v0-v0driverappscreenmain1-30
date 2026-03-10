"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { QueueQRScanner } from "@/components/queue-qr-scanner"
import type { Language } from "@/lib/translations"
import type { QueuePassenger } from "../types"

interface QueuePanelProps {
  passengers: QueuePassenger[]
  onUpdate: (passengers: QueuePassenger[]) => void
  onAccept: (passengerId: number) => void
  onReject: (passengerId: number) => void
  onReturn: (passengerId: number) => void
  disabled: boolean
  language: Language
  t: Record<string, string>
}

export function QueuePanel({
  passengers,
  onUpdate,
  onAccept,
  onReject,
  onReturn,
  disabled,
  language,
  t,
}: QueuePanelProps) {
  return (
    <Card className={`p-4 border-2 border-border ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">{t.queue}</h2>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {passengers.length}
        </Badge>
      </div>

      <QueueQRScanner
        passengers={passengers}
        onUpdate={onUpdate}
        onAccept={onAccept}
        onReject={onReject}
        onReturn={onReturn}
        disabled={disabled}
        language={language}
        t={t}
      />
    </Card>
  )
}
