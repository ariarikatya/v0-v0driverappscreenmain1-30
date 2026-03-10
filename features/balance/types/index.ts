export type PeriodFilter = "today" | "yesterday" | "week" | "month"
export type PaymentFilter = "qr" | "cash"

export interface Transaction {
  id: number
  type: "booking" | "boarding" | "client" | "income"
  amount: number
  passengerName: string
  timestamp: Date
  paymentMethod: "cash" | "qr"
  description?: string
  expanded?: boolean
}

export interface SettlementPerson {
  id: number
  name: string
  amount: number
  type: "driver" | "dispatcher"
  throughDispatcher?: boolean
  selectedDispatcher?: string
  completedAt?: Date
  dispatcherName?: string
}

export interface QRScanData {
  sum: number
  recipient: string
  created_at: string
}

export interface UseBalanceStateReturn {
  language: string
  setLanguage: (lang: string) => void
  periodFilter: PeriodFilter
  setPeriodFilter: (filter: PeriodFilter) => void
  paymentFilters: PaymentFilter[]
  togglePaymentFilter: (filter: PaymentFilter | "all") => void
  balance: number
  setBalance: (value: number) => void
  activeTab: "operations" | "settlements"
  setActiveTab: (tab: "operations" | "settlements") => void
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
  filteredTransactions: Transaction[]
  recalcResults: SettlementPerson[]
  setRecalcResults: (results: SettlementPerson[]) => void
  toAccept: number
  toDebit: number
  saldo: number
  lastRecalcTime: Date | null
  setLastRecalcTime: (d: Date | null) => void
  showCashQRDialog: boolean
  setShowCashQRDialog: (v: boolean) => void
  showGeneratedQR: boolean
  setShowGeneratedQR: (v: boolean) => void
  currentSettlementPerson: SettlementPerson | null
  setCurrentSettlementPerson: (p: SettlementPerson | null) => void
  settlementAction: "debit" | "credit" | null
  setSettlementAction: (a: "debit" | "credit" | null) => void
  generatedQRData: QRScanData | null
  setGeneratedQRData: (d: QRScanData | null) => void
  scannedQRData: QRScanData | null
  setScannedQRData: (d: QRScanData | null) => void
  showQRResult: "operations" | "settlements" | false
  setShowQRResult: (v: "operations" | "settlements" | false) => void
  qrError: null | "not_found" | "mismatch"
  setQRError: (v: null | "not_found" | "mismatch") => void
  deposit: number
  setDeposit: (v: number) => void
  isDepositAdded: boolean
  setIsDepositAdded: (v: boolean) => void
  commission: number
  setCommission: (v: number) => void
  isPanelsDisabled: boolean
  setIsPanelsDisabled: (v: boolean) => void
  t: Record<string, string>
  toggleDispatcher: (personId: number) => void
  selectDispatcher: (personId: number, dispatcherId: string) => void
  toggleTransactionExpanded: (id: number) => void
  totalIncome: number
  totalExpenses: number
  pendingAmount: number
  completedTransactions: Transaction[]
  pendingTransactions: Transaction[]
  recentTransactions: Transaction[]
}

export interface DriverBalance {
  current: number
  deposit: number
  commission: number
  pending: number
  available: number
}

export type TransactionType =
  | "trip_income"
  | "booking_income"
  | "commission"
  | "deposit"
  | "withdrawal"
  | "refund"
  | "penalty"
  | "bonus"

export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled"

export interface BalanceTransaction {
  id: string
  type: TransactionType
  amount: number
  status: TransactionStatus
  description: string
  timestamp: string
  relatedTripId?: string
  notes?: string
}

export interface SettlementResult {
  tripIncome: number
  bookingIncome: number
  commission: number
  totalIncome: number
  netIncome: number
  timestamp: string
}
