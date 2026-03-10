"use client"

import { Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { Language } from "@/lib/translations"
import type { UseBalanceStateReturn } from "../types"
import { formatCurrency } from "@/lib/utils"

interface BalanceCardProps {
  state: Pick<
    UseBalanceStateReturn,
    | "balance"
    | "deposit"
    | "commission"
    | "toAccept"
    | "toDebit"
    | "saldo"
    | "language"
    | "t"
  >
}

export function BalanceCard({ state }: BalanceCardProps) {
  const { balance, deposit, commission, toAccept, toDebit, saldo, language, t } = state

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">{t.currentBalance}</span>
      </div>
      <div className="text-4xl font-bold text-foreground mb-4">{formatCurrency(balance)} RUB</div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">{language === "ru" ? "Принять" : "To Accept"}</div>
            <div className="text-lg font-semibold text-green-600">{formatCurrency(toAccept)} RUB</div>
          </div>
          <div className="p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">{language === "ru" ? "Списать" : "To Debit"}</div>
            <div className="text-lg font-semibold text-orange-600">{formatCurrency(toDebit)} RUB</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">{language === "ru" ? "Депозит" : "Deposit"}</div>
            <div className="text-lg font-semibold text-blue-600">{formatCurrency(deposit)} RUB</div>
          </div>
          <div className="p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">{language === "ru" ? "Сальдо" : "Balance"}</div>
            <div className={`text-lg font-semibold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(saldo)} RUB
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">{t.dailyIncome}</div>
            <div className="text-base font-semibold text-blue-600">{formatCurrency(3250)} RUB</div>
          </div>
          <div className="p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">{t.weeklyIncome}</div>
            <div className="text-base font-semibold text-purple-600">{formatCurrency(18700)} RUB</div>
          </div>
          <div className="p-3 rounded-lg bg-background/50">
            <div className="text-xs text-muted-foreground mb-1">{language === "ru" ? "Комиссия" : "Commission"}</div>
            <div className="text-base font-semibold text-orange-600">{formatCurrency(commission)} RUB</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
