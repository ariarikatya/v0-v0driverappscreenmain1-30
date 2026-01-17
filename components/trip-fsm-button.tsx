// components/trip-fsm-button.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { RaceState, RaceContext, UIFSMState, TransitionAction } from "@/lib/fsm-types"
import { RACE_STATE_TO_BUTTON, logFSMEvent, validateTransition } from "@/lib/fsm-types"

interface TripFSMButtonProps {
  raceState: RaceState
  context: RaceContext
  onTransition: (action: TransitionAction) => Promise<{ status: "ok" | "error"; raceState: RaceState }>
  disabled?: boolean
  className?: string
}

export function TripFSMButton({ 
  raceState, 
  context,
  onTransition, 
  disabled = false, 
  className 
}: TripFSMButtonProps) {
  const [uiFSMState, setUIFSMState] = useState<UIFSMState>("idle")
  const buttonConfig = RACE_STATE_TO_BUTTON[raceState]

  useEffect(() => {
    if (!buttonConfig.enabled || disabled) {
      setUIFSMState("disabled")
    } else if (uiFSMState === "disabled") {
      setUIFSMState("idle")
    }
  }, [buttonConfig.enabled, disabled, uiFSMState])

  const handleClick = async () => {
    if (!buttonConfig.enabled || disabled || buttonConfig.action === "none") {
      logFSMEvent("ui:blocked", { 
        reason: "button_disabled", 
        oldState: raceState,
        context 
      })
      return
    }

    // Валидация перехода ПЕРЕД выполнением
    const validation = validateTransition(raceState, buttonConfig.action, context)
    
    if (!validation.valid) {
      logFSMEvent("transition:blocked", { 
        oldState: raceState,
        action: buttonConfig.action,
        context,
        details: { error: validation.error }
      })
      setUIFSMState("error")
      setTimeout(() => setUIFSMState("idle"), 2000)
      return
    }

    logFSMEvent("fsm:transition_start", { 
      action: buttonConfig.action, 
      oldState: raceState,
      expectedNewState: validation.nextState,
      uiFSMState: "processing",
      context
    })

    setUIFSMState("processing")

    try {
      const response = await onTransition(buttonConfig.action)
      
      if (response.status === "ok") {
        logFSMEvent("fsm:transition_success", { 
          action: buttonConfig.action,
          oldState: raceState,
          newState: response.raceState,
          uiFSMState: "success",
          context
        })
        setUIFSMState("success")
        
        // Return to idle after brief success state
        setTimeout(() => {
          setUIFSMState("idle")
        }, 500)
      } else {
        logFSMEvent("fsm:transition_error", { 
          action: buttonConfig.action,
          oldState: raceState,
          uiFSMState: "error",
          context
        })
        setUIFSMState("error")
        
        // Return to idle after error
        setTimeout(() => {
          setUIFSMState("idle")
        }, 2000)
      }
    } catch (error) {
      logFSMEvent("fsm:transition_error", { 
        action: buttonConfig.action,
        oldState: raceState,
        error: String(error),
        uiFSMState: "error",
        context
      })
      setUIFSMState("error")
      
      setTimeout(() => {
        setUIFSMState("idle")
      }, 2000)
    }
  }

  const isDisabled = uiFSMState === "disabled" || uiFSMState === "processing" || !buttonConfig.enabled || disabled
  const showLoading = uiFSMState === "processing"
  
  const getButtonVariant = () => {
    if (uiFSMState === "error") return "destructive"
    if (uiFSMState === "success") return "default"
    return "default"
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      variant={getButtonVariant()}
      className={className}
      size="lg"
    >
      {showLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {buttonConfig.label}
    </Button>
  )
}
