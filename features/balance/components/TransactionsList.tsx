"use client"

import { AlertCircle, ChevronDown, QrCode, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Transaction, QRScanData } from "../types"
import type { Language } from "@/lib/translations"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface TransactionsListProps {
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  scannedQRData: QRScanData | null
  qrError: null | "not_found" | "mismatch"
  showQRResult: "operations" | "settlements" | false
  language: Language
  t: Record<string, string>
  onScan: () => void
  onAcceptQR: () => void
  onRejectQR: () => void
  onReturnQR: () => void
  onToggleTransactionExpanded: (id: number) => void
}

export function TransactionsList({
  transactions,
  filteredTransactions,
  scannedQRData,
  qrError,
  showQRResult,
  language,
  t,
  onScan,
  onAcceptQR,
  onRejectQR,
  onReturnQR,
  onToggleTransactionExpanded,
}: TransactionsListProps) {
  return (
    <div className="space-y-4 mt-4">
      {showQRResult === "operations" && (scannedQRData || qrError) && (
        <Card
          className={`p-4 border-2 ${
            qrError ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-green-500 bg-green-50 dark:bg-green-900/20"
          }`}
        >
          <div className="space-y-3">
            {qrError === "mismatch" && (
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <AlertCircle className="h-5 w-5" />
                <span>{language === "ru" ? "Несоответствие данных!" : "Data mismatch!"}</span>
              </div>
            )}

            {qrError === "not_found" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <AlertCircle className="h-5 w-5" />
                  <span>{language === "ru" ? "QR не найден" : "QR not found"}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === "ru"
                    ? "Сканируемый QR код не найден в системе."
                    : "Scanned QR code was not found in the system."}
                </div>
              </div>
            ) : (
              scannedQRData && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{t.sumLabel}:</span>
                    <span className={`text-lg font-bold ${qrError ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(scannedQRData.sum)} RUB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{language === "ru" ? "Клиент:" : "Client:"}</span>
                    <span className="text-sm font-semibold">{scannedQRData.recipient}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t.qrCreatedAt}:</span>
                    <span className="text-sm font-semibold">{scannedQRData.created_at}</span>
                  </div>
                </>
              )
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={onAcceptQR} className="flex-1" variant="default" disabled={qrError !== null}>
                {t.accept}
              </Button>
              <Button onClick={onRejectQR} className="flex-1" variant="destructive">
                {t.reject}
              </Button>
              <Button
                onClick={onReturnQR}
                className="h-10 w-10 bg-transparent"
                variant="outline"
                size="icon"
                title={language === "ru" ? "Вернуть" : "Return"}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showQRResult !== "operations" && (
        <Button
          onClick={onScan}
          className="w-full h-14 text-base font-semibold"
          variant="default"
        >
          <QrCode className="mr-2 h-5 w-5" />
          {t.scanQR}
        </Button>
      )}

      <div className="space-y-3">
        {filteredTransactions.map((transaction) => (
          <Card
            key={transaction.id}
            className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => onToggleTransactionExpanded(transaction.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  {transaction.paymentMethod === "qr" ? (
                    <QrCode className="h-5 w-5 text-green-600" />
                  ) : (
                    <Wallet className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {transaction.type} {formatDateTime(transaction.timestamp)} +{formatCurrency(transaction.amount)} {transaction.paymentMethod === "qr" ? t.qr : language === "ru" ? "ЛС" : "LS"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{transaction.passengerName}</div>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${transaction.expanded ? "rotate-180" : ""}`}
              />
            </div>

            {transaction.expanded && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.passengerInfo}:</span>
                    <span className="font-semibold">{transaction.passengerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.paymentAmount}:</span>
                    <span className="font-bold text-green-600">{formatCurrency(transaction.amount)} RUB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.currentTime}:</span>
                    <span className="font-semibold">{formatDateTime(transaction.timestamp)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
