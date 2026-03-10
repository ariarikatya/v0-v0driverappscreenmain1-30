"use client"

import { useEffect, useState } from "react"
import type { PaymentState, PaymentContext } from "@/lib/fsm-types"
import type { UsePaymentsStateReturn } from "../types"

const initialPaymentState: { state: PaymentState; context: PaymentContext } = {
  state: "idle",
  context: {
    paymentType: "cash",
    amount: 0,
  },
}

export function usePaymentsState(): UsePaymentsStateReturn {
  const [paymentFSM, setPaymentFSM] = useState(initialPaymentState)

  useEffect(() => {
    const saved = localStorage.getItem("driverPaymentState")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed?.state) {
        setPaymentFSM(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("driverPaymentState", JSON.stringify(paymentFSM))
  }, [paymentFSM])

  return {
    paymentFSM,
    setPaymentFSM,
  }
}
