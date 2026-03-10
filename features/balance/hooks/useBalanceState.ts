"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { translations } from "@/lib/translations"
import { logger, usePersistentState } from "@/lib/utils"
import type {
  PeriodFilter,
  PaymentFilter,
  Transaction,
  QRScanData,
  SettlementPerson,
  UseBalanceStateReturn,
} from "../types"

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    type: "booking",
    amount: 450,
    passengerName: "Иван П.",
    timestamp: new Date(),
    paymentMethod: "qr",
  },
  {
    id: 2,
    type: "boarding",
    amount: 900,
    passengerName: "Ольга В.",
    timestamp: new Date(Date.now() - 3600000),
    paymentMethod: "qr",
  },
  {
    id: 3,
    type: "client",
    amount: 900,
    passengerName: "Мария С.",
    timestamp: new Date(Date.now() - 7200000),
    paymentMethod: "cash",
  },
]

const INITIAL_SETTLEMENTS: SettlementPerson[] = [
  { id: 1, name: "Водитель Иванов", amount: 1500, type: "driver", throughDispatcher: false, selectedDispatcher: "" },
  { id: 2, name: "Водитель Смирнов", amount: -500, type: "driver", throughDispatcher: false, selectedDispatcher: "" },
]

export function useBalanceState(): UseBalanceStateReturn {
  const [language, setLanguage] = useState<string>("ru")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today")
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilter[]>(["qr", "cash"])

  const [balance, setBalance] = usePersistentState<number>("driverBalance", 12450)
  const [transactions, setTransactions] = usePersistentState<Transaction[]>("balanceTransactions", INITIAL_TRANSACTIONS)

  const [activeTab, setActiveTab] = usePersistentState<"operations" | "settlements">("balanceActiveTab", "operations")

  const [recalcResults, setRecalcResults] = usePersistentState<SettlementPerson[]>("balanceRecalcResults", INITIAL_SETTLEMENTS)
  const [deposit, setDeposit] = usePersistentState<number>("balanceDeposit", 0)
  const [commission, setCommission] = usePersistentState<number>("balanceCommission", 0)
  const [isDepositAdded, setIsDepositAdded] = usePersistentState<boolean>("balanceIsDepositAdded", false)

  const [lastRecalcTime, setLastRecalcTime] = useState<Date | null>(null)

  const [showCashQRDialog, setShowCashQRDialog] = useState(false)
  const [showGeneratedQR, setShowGeneratedQR] = useState(false)
  const [currentSettlementPerson, setCurrentSettlementPerson] = useState<SettlementPerson | null>(null)
  const [settlementAction, setSettlementAction] = useState<"debit" | "credit" | null>(null)
  const [generatedQRData, setGeneratedQRData] = useState<QRScanData | null>(null)

  const [scannedQRData, setScannedQRData] = useState<QRScanData | null>(null)
  const [showQRResult, setShowQRResult] = useState<"operations" | "settlements" | false>(false)
  const [qrError, setQRError] = useState<null | "not_found" | "mismatch">(null)

  const [isPanelsDisabled, setIsPanelsDisabled] = useState(false)

  const t = translations[language] || translations.en

  const togglePaymentFilter = useCallback(
    (filter: PaymentFilter | "all") => {
      if (filter === "all") {
        setPaymentFilters(["qr", "cash"])
        logger.ui("Payment filter: all")
        return
      }

      setPaymentFilters((prev) => {
        if (prev.includes(filter)) {
          const newFilters = prev.filter((f) => f !== filter)
          return newFilters.length === 0 ? ["qr", "cash"] : newFilters
        }
        return [...prev, filter]
      })
    },
    [setPaymentFilters],
  )

  const toggleTransactionExpanded = useCallback(
    (id: number) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t)))
    },
    [setTransactions],
  )

  const toggleDispatcher = useCallback(
    (personId: number) => {
      setRecalcResults((prev) =>
        prev.map((p) =>
          p.id === personId ? { ...p, throughDispatcher: !p.throughDispatcher, selectedDispatcher: "" } : p,
        ),
      )
    },
    [setRecalcResults],
  )

  const selectDispatcher = useCallback(
    (personId: number, dispatcherId: string) => {
      setRecalcResults((prev) => prev.map((p) => (p.id === personId ? { ...p, selectedDispatcher: dispatcherId } : p)))
    },
    [setRecalcResults],
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesPayment = paymentFilters.length === 2 || paymentFilters.includes(t.paymentMethod)
      return matchesPayment
    })
  }, [paymentFilters, transactions])

  const toAccept = useMemo(() => {
    return recalcResults
      .filter((r) => !r.completedAt && r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0)
  }, [recalcResults])

  const toDebit = useMemo(() => {
    return recalcResults
      .filter((r) => !r.completedAt && r.amount < 0)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0)
  }, [recalcResults])

  const saldo = useMemo(() => toAccept - toDebit, [toAccept, toDebit])

  const totalIncome = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions])
  const totalExpenses = useMemo(
    () => transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [transactions],
  )
  const pendingAmount = toAccept
  const completedTransactions = useMemo(() => transactions.filter((t) => !!t.expanded), [transactions])
  const pendingTransactions = useMemo(() => transactions.filter((t) => !t.expanded), [transactions])
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions])

  useEffect(() => {
    // Сбрасываем флаг если появились новые депозит или комиссия
    if ((deposit > 0 || commission > 0) && !recalcResults.some((r) => r.id === 999)) {
      setIsDepositAdded(false)
    }
  }, [deposit, commission, recalcResults])

  return {
    language,
    setLanguage,
    periodFilter,
    setPeriodFilter,
    paymentFilters,
    togglePaymentFilter,
    balance,
    setBalance,
    activeTab,
    setActiveTab,
    transactions,
    setTransactions,
    filteredTransactions,
    recalcResults,
    setRecalcResults,
    toAccept,
    toDebit,
    saldo,
    lastRecalcTime,
    setLastRecalcTime,
    showCashQRDialog,
    setShowCashQRDialog,
    showGeneratedQR,
    setShowGeneratedQR,
    generatedQRData,
    setGeneratedQRData,
    scannedQRData,
    setScannedQRData,
    showQRResult,
    setShowQRResult,
    qrError,
    setQRError,
    deposit,
    setDeposit,
    isDepositAdded,
    setIsDepositAdded,
    commission,
    setCommission,
    isPanelsDisabled,
    setIsPanelsDisabled,
    t,
    currentSettlementPerson,
    setCurrentSettlementPerson,
    settlementAction,
    setSettlementAction,
    toggleDispatcher,
    selectDispatcher,
    toggleTransactionExpanded,
    totalIncome,
    totalExpenses,
    pendingAmount,
    completedTransactions,
    pendingTransactions,
    recentTransactions,
  }
}
