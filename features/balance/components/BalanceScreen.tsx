"use client"

import Link from "next/link"
import { ArrowLeft, AlertCircle, ChevronDown, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { SettlementPerson } from "../types"
import { useBalanceState } from "../hooks/useBalanceState"
import { BalanceCard } from "./BalanceCard"
import { TransactionsList } from "./TransactionsList"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CashQRDialog } from "@/components/cash-qr-dialog"

export function BalanceScreen() {
  const {
    language,
    periodFilter,
    setPeriodFilter,
    paymentFilters,
    togglePaymentFilter,
    balance,
    activeTab,
    setActiveTab,
    filteredTransactions,
    transactions,
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
    commission,
    setCommission,
    isDepositAdded,
    setIsDepositAdded,
    isPanelsDisabled,
    setIsPanelsDisabled,
    currentSettlementPerson,
    setCurrentSettlementPerson,
    settlementAction,
    setSettlementAction,
    recalcResults,
    setRecalcResults,
    toggleDispatcher,
    selectDispatcher,
    toggleTransactionExpanded,
    t,
  } = useBalanceState()

  const { toast } = useToast()

  const resetQrState = () => {
    setShowCashQRDialog(false)
    setShowQRResult(false)
    setScannedQRData(null)
    setQRError(null)
    setCurrentSettlementPerson(null)
    setSettlementAction(null)
    setIsPanelsDisabled(false)
  }

  const handleScanQR = () => {
    setShowCashQRDialog(true)
    setShowQRResult("operations")
  }

  const handleAcceptQR = () => {
    toast({
      title: language === "ru" ? "Операция принята" : "Operation accepted",
      description: `${formatCurrency(scannedQRData?.sum || 0)} RUB`,
    })

    resetQrState()
  }

  const handleRejectQR = () => {
    toast({
      title: language === "ru" ? "Операция отклонена" : "Operation rejected",
      variant: "destructive",
    })
    resetQrState()
  }

  const handleReturnQR = () => {
    setShowQRResult(false)
  }

  const handleRecalculate = () => {
    setLastRecalcTime(new Date())
    setIsPanelsDisabled(true)

    toast({
      title: language === "ru" ? "Список обновлен" : "List updated",
    })

    setTimeout(() => {
      setIsPanelsDisabled(false)
    }, 2000)
  }

  const handleSettlementAction = (person: SettlementPerson, action: "debit" | "credit") => {
    console.log(`[v1] ${action} operation:`, person.id)
    setCurrentSettlementPerson(person)
    setSettlementAction(action)
    setIsPanelsDisabled(true)

    // Для перечисления/списания через диспетчера мы показываем генерацию QR
    setShowCashQRDialog(true)
  }

  const handleQRConfirm = () => {
    // Операции (вкладка Operations)
    if (activeTab === "operations") {
      const mockQRData: { sum: number; recipient: string; created_at: string } = {
        sum: 450,
        recipient: language === "ru" ? "Клиент Иванов И.И." : "Client Ivanov I.",
        created_at: formatDateTime(new Date()),
      }

      setScannedQRData(mockQRData)
      setQRError(null)
      setShowQRResult("operations")
      setShowCashQRDialog(false)
      return
    }

    // Расчеты (вкладка Settlements)
    if (!currentSettlementPerson) return

    const isSimulateNotFound = false
    const isSimulateError = false

    if (isSimulateNotFound) {
      setScannedQRData(null)
      setQRError("not_found")
      setShowQRResult("settlements")
      setShowCashQRDialog(false)
      return
    }

    if (isSimulateError) {
      const mockQRData: { sum: number; recipient: string; created_at: string } = {
        sum: Math.abs(currentSettlementPerson.amount) + 100,
        recipient: "Неизвестный Водитель",
        created_at: formatDateTime(new Date()),
      }
      setScannedQRData(mockQRData)
      setQRError("mismatch")
      setShowQRResult("settlements")
      setShowCashQRDialog(false)
      return
    }

    const mockQRData: { sum: number; recipient: string; created_at: string } = {
      sum: Math.abs(currentSettlementPerson.amount),
      recipient: currentSettlementPerson.name,
      created_at: formatDateTime(new Date()),
    }

    setScannedQRData(mockQRData)
    setQRError(null)
    setShowQRResult("settlements")
    setShowCashQRDialog(false)
  }

  const isQRValidForSettlement = () => {
    if (activeTab !== "settlements" || !currentSettlementPerson || (!scannedQRData && qrError !== null)) return false

    if (qrError === "not_found" || qrError === "mismatch") return false

    const isSumValid = Math.abs((scannedQRData?.sum || 0) - Math.abs(currentSettlementPerson.amount)) < 0.1
    const isNameValid = scannedQRData?.recipient === currentSettlementPerson.name

    return isSumValid && !!isNameValid
  }

  const isValid = isQRValidForSettlement()

  const handleConfirmSettlement = () => {
    if (activeTab === "settlements" && currentSettlementPerson && isValid) {
      const amountToTransfer = currentSettlementPerson.amount < 0 ? Math.abs(currentSettlementPerson.amount) : currentSettlementPerson.amount

      if (currentSettlementPerson.throughDispatcher && currentSettlementPerson.selectedDispatcher) {
        const dispatcherName =
          currentSettlementPerson.selectedDispatcher === "dispatcher1"
            ? language === "ru"
              ? "Диспетчер Петров"
              : "Dispatcher Petrov"
            : language === "ru"
            ? "Диспетчер Сидоров"
            : "Dispatcher Sidorov"

        setRecalcResults((prev) => {
          const existingDispatcher = prev.find((p) => p.name === dispatcherName && p.type === "dispatcher")

          let newRecalcResults = prev.map((p) =>
            p.id === currentSettlementPerson.id
              ? {
                  ...p,
                  completedAt: new Date(),
                  throughDispatcher: false,
                  selectedDispatcher: "",
                  dispatcherName: dispatcherName,
                }
              : p,
          )

          if (existingDispatcher) {
            newRecalcResults = newRecalcResults.map((p) =>
              p.id === existingDispatcher.id ? { ...p, amount: p.amount - amountToTransfer } : p,
            )
          } else {
            const newDispatcherItem = {
              id: Date.now(),
              name: dispatcherName,
              amount: -amountToTransfer,
              type: "dispatcher" as const,
              throughDispatcher: false,
            }
            newRecalcResults = [...newRecalcResults, newDispatcherItem]
          }
          return newRecalcResults
        })

        toast({
          title: language === "ru" ? "Перенесено на диспетчера" : "Transferred to dispatcher",
          description: `${dispatcherName}: ${formatCurrency(amountToTransfer)} RUB`,
        })
      } else {
        setRecalcResults((prev) =>
          prev.map((p) =>
            p.id === currentSettlementPerson.id
              ? { ...p, completedAt: new Date(), throughDispatcher: false, selectedDispatcher: "" }
              : p,
          ),
        )

        toast({
          title: language === "ru" ? "Операция принята" : "Operation accepted",
          description: `${formatCurrency(scannedQRData?.sum || currentSettlementPerson.amount)} RUB`,
        })
      }
    }

    resetQrState()
  }

  const handleRejectSettlement = () => {
    toast({
      title: language === "ru" ? "Операция отклонена" : "Operation rejected",
      variant: "destructive",
    })
    resetQrState()
  }

  const handleCloseGeneratedQR = () => {
    setShowGeneratedQR(false)
    setGeneratedQRData(null)
    setCurrentSettlementPerson(null)
    setSettlementAction(null)
    setIsPanelsDisabled(false)
    toast({
      title: language === "ru" ? "QR код закрыт" : "QR code closed",
    })
  }

  const handleAddDepositAndCommission = () => {
    const depositExists = recalcResults.some((r) => r.id === 999)
    if (depositExists) return

    const depositItem = {
      id: 999,
      name: language === "ru" ? "Депозит и комиссия" : "Deposit and comission",
      amount: -(deposit + commission),
      type: "driver" as const,
      throughDispatcher: true,
      selectedDispatcher: "",
    }

    setRecalcResults((prev) => [...prev, depositItem])
    setIsDepositAdded(true)

    toast({
      title: language === "ru" ? "Депозит и комиссия добавлены" : "Deposit and comission added",
    })
  }

  const isSettlementButtonDisabled = (result: { type: string; throughDispatcher?: boolean; selectedDispatcher?: string }) =>
    (result.type === "dispatcher" && result.throughDispatcher) ||
    (result.throughDispatcher && !result.selectedDispatcher) ||
    (result.type === "dispatcher" && showQRResult === "settlements")

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground flex-1">{t.driverBalance}</h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        <BalanceCard
          state={{
            balance,
            deposit,
            commission,
            toAccept,
            toDebit,
            saldo,
            language,
            t,
          }}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "operations" | "settlements")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="operations">{language === "ru" ? "Операции" : "Operations"}</TabsTrigger>
            <TabsTrigger value="settlements">{language === "ru" ? "Расчеты" : "Settlements"}</TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4 mt-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as "today" | "yesterday" | "week" | "month")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t.today} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t.today}</SelectItem>
                  <SelectItem value="yesterday">{t.yesterday}</SelectItem>
                  <SelectItem value="week">{t.week}</SelectItem>
                  <SelectItem value="month">{t.month}</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[120px] justify-between bg-transparent">
                    <span className="text-sm">
                      {paymentFilters.length === 2
                        ? language === "ru"
                          ? "Все"
                          : "All"
                        : paymentFilters.length === 1
                        ? paymentFilters[0] === "qr"
                          ? t.qr
                          : language === "ru"
                          ? "ЛС"
                          : "LS"
                        : language === "ru"
                        ? "Все"
                        : "All"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[120px]">
                  <DropdownMenuCheckboxItem
                    checked={paymentFilters.length === 2}
                    onCheckedChange={() => togglePaymentFilter("all")}
                  >
                    {language === "ru" ? "Все" : "All"}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={paymentFilters.includes("qr")}
                    onCheckedChange={() => togglePaymentFilter("qr")}
                  >
                    {t.qr}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={paymentFilters.includes("cash")}
                    onCheckedChange={() => togglePaymentFilter("cash")}
                  >
                    {language === "ru" ? "ЛС" : "LS"}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TransactionsList
              transactions={transactions}
              filteredTransactions={filteredTransactions}
              scannedQRData={scannedQRData}
              qrError={qrError}
              showQRResult={showQRResult}
              language={language}
              t={t}
              onScan={handleScanQR}
              onAcceptQR={handleAcceptQR}
              onRejectQR={handleRejectQR}
              onReturnQR={handleReturnQR}
              onToggleTransactionExpanded={toggleTransactionExpanded}
            />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4 mt-4">
            <Card className={`p-4 border-2 border-border ${isPanelsDisabled ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={handleRecalculate}
                    variant="outline"
                    className="font-bold border-2 border-primary/20 hover:border-primary/50 bg-transparent"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === "ru" ? "Перерасчет" : "Recalculate"}
                  </Button>
                  {lastRecalcTime && (
                    <span className="text-xs text-muted-foreground font-mono">{formatDateTime(lastRecalcTime)}</span>
                  )}
                </div>

                {deposit > 0 && !isDepositAdded && (
                  <Button onClick={handleAddDepositAndCommission} variant="default" className="w-full">
                    {language === "ru"
                      ? "Добавить депозит и комиссию в расчеты"
                      : "Add deposit and commission in settlements"}
                  </Button>
                )}
              </div>

              {showQRResult === "settlements" && (
                <Card
                  className={`p-4 mb-4 border-2 ${
                    isValid
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-red-500 bg-red-50 dark:bg-red-900/20"
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
                            <span className={`text-lg font-bold ${isValid ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(scannedQRData.sum)} RUB
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {language === "ru" ? "В QR коде:" : "In QR code:"}
                            </span>
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
                      <Button onClick={handleConfirmSettlement} className="flex-1" variant="default" disabled={!isValid}>
                        {t.accept}
                      </Button>
                      <Button onClick={handleRejectSettlement} className="flex-1" variant="destructive">
                        {t.reject}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {recalcResults.map((result) => {
                  if (result.completedAt) {
                    return (
                      <div
                        key={result.id}
                        className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/10 border-green-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{result.name}</span>
                          <span className="font-bold text-green-700">{formatCurrency(result.amount)} RUB</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                          {result.type !== "dispatcher" && result.dispatcherName && (
                            <span>
                              {language === "ru" ? "Через" : "Through"} {result.dispatcherName}
                            </span>
                          )}
                          <span className={result.type !== "dispatcher" && result.dispatcherName ? "" : "ml-auto"}>
                            {formatDateTime(result.completedAt)}
                          </span>
                        </div>
                      </div>
                    )
                  }

                  const showButtons = result.type === "driver" || (result.amount !== 0 && result.type === "dispatcher")

                  return (
                    <div key={result.id} className="p-3 border rounded-lg bg-secondary">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">{result.name}</span>
                        <span className={`text-sm font-bold ${result.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                          {formatCurrency(result.amount)} RUB
                        </span>
                      </div>

                      {showButtons && (
                        <div className="flex gap-2 mb-3">
                          {result.amount < 0 ? (
                            <Button
                              onClick={() => handleSettlementAction(result, "debit")}
                              size="sm"
                              variant="destructive"
                              className="w-full"
                              disabled={isSettlementButtonDisabled(result)}
                            >
                              {language === "ru" ? "Списать" : "Debit"}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleSettlementAction(result, "credit")}
                              size="sm"
                              variant="default"
                              className="w-full"
                              disabled={isSettlementButtonDisabled(result)}
                            >
                              {language === "ru" ? "Принять" : "Accept"}
                            </Button>
                          )}
                        </div>
                      )}

                      {result.type === "driver" && (
                        <>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`dispatcher-${result.id}`}
                              checked={!!result.throughDispatcher}
                              onCheckedChange={() => toggleDispatcher(result.id)}
                              disabled={result.id === 999}
                            />
                            <label htmlFor={`dispatcher-${result.id}`} className="text-sm">
                              {language === "ru" ? "Через диспетчера" : "Through dispatcher"}
                              {result.id === 999 && <span className="text-red-500 ml-1">*</span>}
                            </label>
                          </div>

                          {result.throughDispatcher && (
                            <Select
                              value={result.selectedDispatcher || ""}
                              onValueChange={(value) => selectDispatcher(result.id, value)}
                            >
                              <SelectTrigger className="w-full mt-2">
                                <SelectValue
                                  placeholder={language === "ru" ? "Выберите диспетчера" : "Select dispatcher"}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dispatcher1">
                                  {language === "ru" ? "Диспетчер Петров" : "Dispatcher Petrov"}
                                </SelectItem>
                                <SelectItem value="dispatcher2">
                                  {language === "ru" ? "Диспетчер Сидоров" : "Dispatcher Sidorov"}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showGeneratedQR} onOpenChange={setShowGeneratedQR}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {language === "ru" ? "QR код для списания" : "QR code for debit"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {language === "ru"
                  ? "Покажите этот QR код водителю для списания средств"
                  : "Show this QR code to the driver to debit funds"}
              </p>
            </div>

            {generatedQRData && (
              <Card className="p-4 bg-secondary">
                <div className="flex items-center justify-center p-8 mb-4">
                  <div className="w-full space-y-3">
                    <Button
                      onClick={() => {
                        if (currentSettlementPerson) {
                          setRecalcResults((prev) =>
                            prev.map((p) =>
                              p.id === currentSettlementPerson.id
                                ? { ...p, completedAt: new Date(), throughDispatcher: false, selectedDispatcher: "" }
                                : p,
                            ),
                          )

                          if (currentSettlementPerson.id === 999) {
                            setDeposit(0)
                            setCommission(0)
                          }

                          toast({
                            title: language === "ru" ? "Операция выполнена" : "Operation completed",
                            description: `${formatCurrency(generatedQRData.sum)} RUB`,
                          })
                        }

                        setShowGeneratedQR(false)
                        setGeneratedQRData(null)
                        setCurrentSettlementPerson(null)
                        setSettlementAction(null)
                        setIsPanelsDisabled(false)
                      }}
                      variant="default"
                      className="w-full h-24 text-lg font-semibold"
                    >
                      {language === "ru" ? "ОК - Успешно" : "OK - Success"}
                    </Button>
                    <Button
                      onClick={() => {
                        toast({
                          title: language === "ru" ? "Операция отклонена" : "Operation rejected",
                          variant: "destructive",
                        })
                        setShowGeneratedQR(false)
                        setGeneratedQRData(null)
                        setCurrentSettlementPerson(null)
                        setSettlementAction(null)
                        setIsPanelsDisabled(false)
                      }}
                      variant="destructive"
                      className="w-full h-24 text-lg font-semibold"
                    >
                      {language === "ru" ? "НЕ ОК - Ошибка" : "NOT OK - Error"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.sumLabel}:</span>
                    <span className="font-bold text-lg">{formatCurrency(generatedQRData.sum)} RUB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.recipientInfo}:</span>
                    <span className="font-semibold">{generatedQRData.recipient}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.qrCreatedAt}:</span>
                    <span className="font-semibold">{generatedQRData.created_at}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CashQRDialog
        open={showCashQRDialog}
        onOpenChange={setShowCashQRDialog}
        driverName={language === "ru" ? "Водитель Иванов И.И." : "Driver Ivanov I."}
        amount={currentSettlementPerson?.amount || 0}
        currency="RUB"
        onConfirm={handleQRConfirm}
        onInvalid={() => {}}
        language={language}
        showNotFoundButton={false}
      />
    </div>
  )
}
