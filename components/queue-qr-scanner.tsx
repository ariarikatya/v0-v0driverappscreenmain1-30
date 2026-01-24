// components/queue-qr-scanner.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, X, User } from "lucide-react"
import { CashQRDialog } from "@/components/cash-qr-dialog"
import { formatCurrency } from "@/lib/utils"
import { logFSMEvent } from "@/lib/fsm-types"
import type { Language } from "@/lib/translations"

export interface QueuePassenger {
  id: number
  name: string
  queuePosition: number
  isFirst: boolean
  count: number
  ticketCount: number
  orderNumber: number
  scanned?: boolean
  qrError?: boolean
  qrData?: {
    sum: number
    recipient: string
    created_at: string
  }
  fsmState?: "waiting" | "selected" | "scanning" | "scan_success" | "scan_error" | "accepted" | "rejected"
}

interface QueueQRScannerProps {
  passengers: QueuePassenger[]
  onUpdate: (passengers: QueuePassenger[]) => void
  onAccept: (passengerId: number) => void
  onReject: (passengerId: number) => void
  onReturn: (passengerId: number) => void
  disabled: boolean
  language: Language
  t: Record<string, string>
}

export function QueueQRScanner({
  passengers,
  onUpdate,
  onAccept,
  onReject,
  onReturn,
  disabled,
  language,
  t,
}: QueueQRScannerProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [currentScanId, setCurrentScanId] = useState<number | null>(null)
  const [scanLocked, setScanLocked] = useState(false)
  const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(null)

  const handlePassengerClick = (passengerId: number) => {
    const passenger = passengers.find(p => p.id === passengerId)
    
    // Если пассажир уже принят (scanned БЕЗ qrError и БЕЗ qrData - значит accepted)
    if (passenger && passenger.scanned && !passenger.qrError && !passenger.qrData) {
      return
    }
    
    if (selectedPassengerId === passengerId) {
      setSelectedPassengerId(null)
    } else {
      setSelectedPassengerId(passengerId)
    }
  }

  const handleStartScan = () => {
    if (disabled) {
      logFSMEvent("ui:blocked", { 
        action: "queue_scan", 
        reason: "preparation_not_started" 
      })
      return
    }

    // Используем выбранного пассажира или первого необработанного
    const passengerId = selectedPassengerId || passengers.find(p => 
      (!p.scanned || p.qrError) && p.fsmState !== "scan_success"
    )?.id
    
    if (!passengerId) {
      logFSMEvent("ui:blocked", { 
        action: "queue_scan", 
        reason: "no_passengers_available" 
      })
      return
    }

    logFSMEvent("scan:start", { 
      passengerId,
      context: "queue",
      selected: !!selectedPassengerId
    })

    setCurrentScanId(passengerId)
    setScanLocked(true)
    setShowScanner(true)
  }

  const handleScanSuccess = () => {
    if (!currentScanId) return

    const passenger = passengers.find(p => p.id === currentScanId)
    if (!passenger) return

    logFSMEvent("scan:result", {
      passengerId: currentScanId,
      match: true,
      amount: passenger.ticketCount * 320
    })

    const mockQRData = {
      sum: passenger.ticketCount * 320,
      recipient: language === "ru" ? "Водитель Иванов И.И." : "Driver Ivanov I.",
      created_at: new Date().toISOString(),
    }

    const updatedPassengers = passengers.map(p =>
      p.id === currentScanId
        ? {
            ...p,
            scanned: true,
            qrError: false,
            qrData: mockQRData,
            fsmState: "scan_success" as const,
          }
        : p
    )

    onUpdate(updatedPassengers)
    
    setSelectedPassengerId(null)
    setShowScanner(false)
    setCurrentScanId(null)
    setScanLocked(false)
  }

  const handleScanError = () => {
    if (!currentScanId) return

    logFSMEvent("scan:error", {
      passengerId: currentScanId,
      error: "Invalid QR"
    })

    const updatedPassengers = passengers.map(p =>
      p.id === currentScanId
        ? {
            ...p,
            qrError: true,
            scanned: false,
            fsmState: "scan_error" as const,
          }
        : p
    )

    onUpdate(updatedPassengers)
    
    // НЕ сбрасываем выбор - оставляем пассажира выбранным для повторного сканирования
    setShowScanner(false)
    setCurrentScanId(null)
    setScanLocked(false)
  }

  const handleAccept = (passengerId: number) => {
    logFSMEvent("accept:clicked", { 
      passengerId,
      context: "queue"
    })
    setSelectedPassengerId(null)
    onAccept(passengerId)
  }

  const handleReject = (passengerId: number) => {
    logFSMEvent("reject:clicked", { 
      passengerId,
      context: "queue"
    })
    setSelectedPassengerId(null)
    onReject(passengerId)
  }

  const handleReturn = (passengerId: number) => {
    logFSMEvent("return:clicked", { 
      passengerId,
      context: "queue"
    })
    
    const updatedPassengers = passengers.map(p =>
      p.id === passengerId
        ? {
            ...p,
            scanned: false,
            qrError: false,
            qrData: undefined,
            fsmState: "waiting" as const,
          }
        : p
    )
    
    onUpdate(updatedPassengers)
    setSelectedPassengerId(null)
    onReturn(passengerId)
  }

  const renderPassengerIcons = (count: number) => {
    const iconCount = Math.min(count, 3)
    return Array(iconCount)
      .fill(0)
      .map((_, i) => <User key={i} className="h-4 w-4" />)
  }

  // ИСПРАВЛЕНИЕ: показываем пассажиров которые:
  // 1. Еще не приняты (fsmState !== "accepted")
  // 2. ИЛИ имеют ошибку сканирования
  // 3. ИЛИ успешно отсканированы но еще не приняты (scan_success)
  const visiblePassengers = passengers.filter(p => 
    p.fsmState !== "accepted" && p.fsmState !== "rejected"
  )
  
  const passengersWithRenumbering = visiblePassengers.map((p, index) => ({
    ...p,
    queuePosition: index + 1
  }))

  // Пассажиры, ожидающие решения (успешно отсканированы)
  const pendingDecision = passengers.filter(p => 
    p.scanned && p.qrData && !p.qrError && p.fsmState === "scan_success"
  )

  return (
    <>
      {/* Grid of passengers */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {passengersWithRenumbering.slice(0, 5).map((passenger) => {
          const isSelected = selectedPassengerId === passenger.id
          const isPendingDecision = passenger.fsmState === "scan_success"
          
          return (
            <div
              key={passenger.id}
              onClick={() => !isPendingDecision && handlePassengerClick(passenger.id)}
              className={`h-20 flex flex-col items-center justify-center p-2 rounded-md border-2 transition-all ${
                passenger.qrError
                  ? "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-600"
                  : isPendingDecision
                    ? "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-600"
                    : isSelected
                      ? "bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-600 ring-2 ring-blue-500"
                      : "bg-secondary border-border"
              } ${!isPendingDecision ? "cursor-pointer hover:bg-accent/10" : "cursor-default opacity-50"}`}
            >
              {passenger.qrError && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReturn(passenger.id)
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 p-0 mb-1"
                  title={t.revert}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              )}
              {isPendingDecision && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReturn(passenger.id)
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 p-0 mb-1"
                  title={t.revert}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 text-green-700" />
                </Button>
              )}
              {!passenger.qrError && !isPendingDecision && (
                <div className="flex items-center gap-0.5 mb-1">{renderPassengerIcons(passenger.count)}</div>
              )}
              <span className="text-xs font-bold">
                {passenger.queuePosition} • {passenger.count}
              </span>
              {isSelected && !isPendingDecision && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  {language === "ru" ? "Выбран" : "Selected"}
                </span>
              )}
              {passenger.qrError && (
                <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                  {language === "ru" ? "Ошибка" : "Error"}
                </span>
              )}
              {isPendingDecision && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold mt-0.5">
                  {language === "ru" ? "Скан OK" : "Scan OK"}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Show accept/reject buttons for successfully scanned passengers */}
      {pendingDecision.map(passenger => (
        <div key={passenger.id} className="mb-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
          <p className="text-sm font-semibold mb-2">{passenger.name}</p>
          <p className="text-sm mb-3">{t.sumLabel}: {formatCurrency(passenger.qrData!.sum)} RUB</p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleAccept(passenger.id)}
              className="flex-1"
              disabled={disabled}
            >
              {t.accept}
            </Button>
            <Button
              onClick={() => handleReject(passenger.id)}
              variant="destructive"
              className="flex-1"
              disabled={disabled}
            >
              {t.reject}
            </Button>
          </div>
        </div>
      ))}

      {/* Main scan button - только если нет pending accept/reject */}
      {pendingDecision.length === 0 && (
        <Button 
          onClick={handleStartScan} 
          className="w-full" 
          disabled={disabled || scanLocked}
        >
          <QrCode className="mr-2 h-4 w-4" />
          {t.scanQR}
        </Button>
      )}

      {/* Scanner dialog */}
      <CashQRDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        driverName={language === "ru" ? "Водитель Иванов И.И." : "Driver Ivanov I."}
        amount={320}
        currency="RUB"
        onConfirm={handleScanSuccess}
        onInvalid={handleScanError}
        language={language}
        showNotFoundButton={true}
        onQRNotFound={handleScanError}
      />
    </>
  )
}
