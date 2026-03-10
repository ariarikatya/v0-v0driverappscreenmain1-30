import type { PaymentState, PaymentContext } from "@/lib/fsm-types"

export interface UsePaymentsStateReturn {
  paymentFSM: {
    state: PaymentState
    context: PaymentContext
  }
  setPaymentFSM: React.Dispatch<React.SetStateAction<{ state: PaymentState; context: PaymentContext }>>
}
