// lib/fsm-types.ts - ПОЛНАЯ АРХИТЕКТУРА FSM

// ============================================================================
// СЕРВЕРНЫЕ СОСТОЯНИЯ (RaceState) - источник истины
// ============================================================================
export type RaceState =
  | "RACE_OFFLINE"
  | "RACE_WAITING_START"
  | "RACE_BOARDING"
  | "RACE_IN_TRANSIT"
  | "RACE_ARRIVED_STOP"
  | "RACE_FINISHED";

// ============================================================================
// КОНТЕКСТ РЕЙСА
// ============================================================================
export interface RaceContext {
  currentStopIndex: number;
  totalStops: number;
  freeSeats: number;
  occupiedSeats: number;
  hasActiveReservations: boolean;
  queueSize: number;
  isLastStop: boolean;
  tripId: string;
}

// ============================================================================
// РАЗРЕШЁННЫЕ ПЕРЕХОДЫ РЕЙСА
// ============================================================================
export type TransitionAction =
  | "start_shift"
  | "start_boarding"
  | "depart_stop"
  | "arrive_stop"
  | "continue_boarding"
  | "finish_trip"
  | "end_shift"
  | "none";

export interface Transition {
  from: RaceState;
  to: RaceState;
  action: TransitionAction;
  guard?: (context: RaceContext) => boolean;
}

export const FSM_TRANSITIONS: Transition[] = [
  {
    from: "RACE_OFFLINE",
    to: "RACE_WAITING_START",
    action: "start_shift",
  },
  {
    from: "RACE_WAITING_START",
    to: "RACE_BOARDING",
    action: "start_boarding",
  },
  {
    from: "RACE_BOARDING",
    to: "RACE_IN_TRANSIT",
    action: "depart_stop",
  },
  {
    from: "RACE_IN_TRANSIT",
    to: "RACE_ARRIVED_STOP",
    action: "arrive_stop",
  },
  {
    from: "RACE_ARRIVED_STOP",
    to: "RACE_BOARDING",
    action: "continue_boarding",
    guard: (ctx) => !ctx.isLastStop,
  },
  {
    from: "RACE_ARRIVED_STOP",
    to: "RACE_FINISHED",
    action: "finish_trip",
    guard: (ctx) => ctx.isLastStop,
  },
  {
    from: "RACE_FINISHED",
    to: "RACE_OFFLINE",
    action: "end_shift",
  },
];

// ============================================================================
// FSM ЭЛЕКТРОННОЙ ОЧЕРЕДИ (Скриншот 1)
// ============================================================================

export type QueuePassengerState = 
  | "waiting"
  | "selected"
  | "scanning"
  | "scan_success"
  | "scan_error"
  | "accepted"
  | "rejected";

export interface QueueContext {
  passengerId: number;
  queuePosition: number;
  ticketCount: number;
  qrScanned: boolean;
  qrValid: boolean;
}

export type QueueAction =
  | "select_passenger"
  | "start_scan"
  | "scan_success"
  | "scan_error"
  | "retry_scan"
  | "accept_passenger"
  | "reject_passenger"
  | "revert_scan";

export const QUEUE_FSM_TRANSITIONS: Array<{
  from: QueuePassengerState;
  to: QueuePassengerState;
  action: QueueAction;
}> = [
  { from: "waiting", to: "selected", action: "select_passenger" },
  { from: "selected", to: "scanning", action: "start_scan" },
  { from: "scanning", to: "scan_success", action: "scan_success" },
  { from: "scanning", to: "scan_error", action: "scan_error" },
  { from: "scan_error", to: "scanning", action: "retry_scan" },
  { from: "scan_success", to: "accepted", action: "accept_passenger" },
  { from: "scan_success", to: "rejected", action: "reject_passenger" },
  { from: "scan_error", to: "waiting", action: "revert_scan" },
  { from: "scan_success", to: "waiting", action: "revert_scan" },
];

// ============================================================================
// FSM ОПЛАТЫ/ДЕПОЗИТА (Скриншот 2)
// ============================================================================

export type PaymentState =
  | "idle"
  | "scan_qr"
  | "enter_amount"
  | "confirm"
  | "processing"
  | "success"
  | "error";

export interface PaymentContext {
  paymentType: "booking" | "queue" | "deposit" | "cash";
  amount: number;
  passengerId?: number;
  qrData?: {
    sum: number;
    recipient: string;
    created_at: string;
  };
  errorMessage?: string;
}

export type PaymentAction =
  | "start_scan"
  | "qr_scanned"
  | "qr_invalid"
  | "amount_entered"
  | "confirm_payment"
  | "payment_processed"
  | "payment_failed"
  | "retry"
  | "cancel";

export const PAYMENT_FSM_TRANSITIONS: Array<{
  from: PaymentState;
  to: PaymentState;
  action: PaymentAction;
}> = [
  { from: "idle", to: "scan_qr", action: "start_scan" },
  { from: "scan_qr", to: "confirm", action: "qr_scanned" },
  { from: "scan_qr", to: "error", action: "qr_invalid" },
  { from: "idle", to: "enter_amount", action: "amount_entered" },
  { from: "enter_amount", to: "confirm", action: "confirm_payment" },
  { from: "confirm", to: "processing", action: "payment_processed" },
  { from: "processing", to: "success", action: "payment_processed" },
  { from: "processing", to: "error", action: "payment_failed" },
  { from: "error", to: "scan_qr", action: "retry" },
  { from: "error", to: "idle", action: "cancel" },
  { from: "success", to: "idle", action: "cancel" },
];

// ============================================================================
// FSM ПРЕДРЕЙСОВОГО ЭКРАНА (Скриншот 3)
// ============================================================================

export type PreRaceState =
  | "route_selection"
  | "direction_selection"
  | "route_confirmed"
  | "ready_to_start";

export interface PreRaceContext {
  selectedRouteId: string | null;
  isDirectionReversed: boolean;
  routeStops: Array<{ id: number; name: string; time: string }>;
  canStartTrip: boolean;
}

export type PreRaceAction =
  | "select_route"
  | "toggle_direction"
  | "confirm_route"
  | "start_preparation";

export const PRE_RACE_FSM_TRANSITIONS: Array<{
  from: PreRaceState;
  to: PreRaceState;
  action: PreRaceAction;
}> = [
  { from: "route_selection", to: "direction_selection", action: "select_route" },
  { from: "direction_selection", to: "direction_selection", action: "toggle_direction" },
  { from: "direction_selection", to: "route_confirmed", action: "confirm_route" },
  { from: "route_confirmed", to: "ready_to_start", action: "start_preparation" },
];

// ============================================================================
// АГРЕГИРОВАННОЕ СОСТОЯНИЕ ЭКРАНА ВОДИТЕЛЯ
// ============================================================================

export interface DriverScreenState {
  preRaceState: PreRaceState | null;
  raceState: RaceState;
  queuePanelMode: QueuePanelMode;
  cashPanelMode: CashPanelMode;
}

// ============================================================================
// UI FSM СОСТОЯНИЯ
// ============================================================================
export type UIFSMState = "idle" | "processing" | "success" | "error" | "disabled";

// ============================================================================
// РЕЖИМЫ ПАНЕЛЕЙ (расширенные)
// ============================================================================

export type QueuePanelMode = 
  | "hidden"
  | "active"
  | "locked"
  | "scanning"
  | "awaiting_decision";

export type ReservationPanelMode = 
  | "hidden" 
  | "waiting" 
  | "confirming" 
  | "expired";

export type CashPanelMode = 
  | "hidden"
  | "active"
  | "scanning"
  | "entering_amount"
  | "confirming"
  | "processing"
  | "success"
  | "error";

export interface PanelVisibility {
  mainButton: boolean;
  queue: QueuePanelMode;
  reservation: ReservationPanelMode;
  cash: CashPanelMode;
}

// ============================================================================
// КОНФИГУРАЦИЯ КНОПКИ
// ============================================================================
export interface ButtonConfig {
  label: string;
  action: TransitionAction;
  enabled: boolean;
  variant?: "default" | "destructive" | "outline";
}

// ============================================================================
// МАППИНГ: RaceState → ButtonConfig
// ============================================================================
export function getButtonConfig(
  state: RaceState,
  language: "ru" | "en" | "fr" | "ar" | string = "ru"
): ButtonConfig {
  const labels = {
    ru: {
      RACE_OFFLINE: "Выйти на линию",
      RACE_WAITING_START: "Начать посадку",
      RACE_BOARDING: "Отправиться",
      RACE_IN_TRANSIT: "Прибыл",
      RACE_ARRIVED_STOP: "Продолжить посадку",
      RACE_FINISHED: "Завершить рейс",
    },
    en: {
      RACE_OFFLINE: "Start Shift",
      RACE_WAITING_START: "Start Boarding",
      RACE_BOARDING: "Depart",
      RACE_IN_TRANSIT: "Arrived",
      RACE_ARRIVED_STOP: "Continue Boarding",
      RACE_FINISHED: "End Shift",
    },
  };

  const langLabels = labels[language as keyof typeof labels] || labels.ru;

  const configs: Record<RaceState, ButtonConfig> = {
    RACE_OFFLINE: {
      label: langLabels.RACE_OFFLINE,
      action: "start_shift",
      enabled: true,
    },
    RACE_WAITING_START: {
      label: langLabels.RACE_WAITING_START,
      action: "start_boarding",
      enabled: true,
    },
    RACE_BOARDING: {
      label: langLabels.RACE_BOARDING,
      action: "depart_stop",
      enabled: true,
    },
    RACE_IN_TRANSIT: {
      label: langLabels.RACE_IN_TRANSIT,
      action: "arrive_stop",
      enabled: true,
    },
    RACE_ARRIVED_STOP: {
      label: langLabels.RACE_ARRIVED_STOP,
      action: "continue_boarding",
      enabled: true,
    },
    RACE_FINISHED: {
      label: langLabels.RACE_FINISHED,
      action: "end_shift",
      enabled: true,
    },
  };

  return configs[state];
}

// Legacy
export const RACE_STATE_TO_BUTTON: Record<RaceState, ButtonConfig> = {
  RACE_OFFLINE: { label: "Выйти на линию", action: "start_shift", enabled: true },
  RACE_WAITING_START: { label: "Начать посадку", action: "start_boarding", enabled: true },
  RACE_BOARDING: { label: "Отправиться", action: "depart_stop", enabled: true },
  RACE_IN_TRANSIT: { label: "Прибыл", action: "arrive_stop", enabled: true },
  RACE_ARRIVED_STOP: { label: "Продолжить", action: "continue_boarding", enabled: true },
  RACE_FINISHED: { label: "Завершить рейс", action: "end_shift", enabled: true },
};

// ============================================================================
// МАППИНГ: RaceState → PanelVisibility
// ============================================================================
export function getPanelVisibility(
  state: RaceState,
  context: RaceContext
): PanelVisibility {
  switch (state) {
    case "RACE_OFFLINE":
      return {
        mainButton: true,
        queue: "hidden",
        reservation: "hidden",
        cash: "hidden",
      };

    case "RACE_WAITING_START":
      return {
        mainButton: true,
        queue: "hidden",
        reservation: "hidden",
        cash: "hidden",
      };

    case "RACE_BOARDING":
      return {
        mainButton: true,
        queue: context.queueSize > 0 ? "active" : "hidden",
        reservation: context.hasActiveReservations || context.currentStopIndex === 0 ? "waiting" : "hidden",
        cash: "active",
      };

    case "RACE_IN_TRANSIT":
      return {
        mainButton: true,
        queue: "hidden",
        reservation: "hidden",
        cash: "hidden",
      };

    case "RACE_ARRIVED_STOP":
      return {
        mainButton: true,
        queue: context.queueSize > 0 ? "active" : "hidden",
        reservation: context.hasActiveReservations ? "waiting" : "hidden",
        cash: "active",
      };

    case "RACE_FINISHED":
      return {
        mainButton: false, // ← ИСПРАВЛЕНО
        queue: "hidden",
        reservation: "hidden",
        cash: "hidden",
      };

    default:
      return {
        mainButton: false,
        queue: "hidden",
        reservation: "hidden",
        cash: "hidden",
      };
  }
}

// ============================================================================
// LEGACY МАППИНГ
// ============================================================================
export const TRIP_STATUS_TO_RACE_STATE: Record<string, RaceState> = {
  PREP_IDLE: "RACE_OFFLINE",
  PREP_TIMER: "RACE_WAITING_START",
  BOARDING: "RACE_BOARDING",
  ROUTE_READY: "RACE_ARRIVED_STOP",
  IN_ROUTE: "RACE_IN_TRANSIT",
  FINISHED: "RACE_FINISHED",
};

// ============================================================================
// ВАЛИДАЦИЯ И УТИЛИТЫ
// ============================================================================

export function canTransition(
  currentState: RaceState,
  action: TransitionAction,
  context: RaceContext
): boolean {
  const transition = FSM_TRANSITIONS.find(
    (t) => t.from === currentState && t.action === action
  );

  if (!transition) {
    return false;
  }

  if (transition.guard && !transition.guard(context)) {
    return false;
  }

  return true;
}

export function getNextState(
  currentState: RaceState,
  action: TransitionAction,
  context: RaceContext
): RaceState | null {
  if (!canTransition(currentState, action, context)) {
    return null;
  }

  const transition = FSM_TRANSITIONS.find(
    (t) => t.from === currentState && t.action === action
  );

  return transition?.to || null;
}

export function getAvailableActions(
  currentState: RaceState,
  context: RaceContext
): TransitionAction[] {
  return FSM_TRANSITIONS.filter(
    (t) => t.from === currentState && (!t.guard || t.guard(context))
  ).map((t) => t.action);
}

// ============================================================================
// ЛОГИРОВАНИЕ
// ============================================================================
export interface FSMEvent {
  event: string;
  timestamp: string;
  oldState?: RaceState;
  newState?: RaceState;
  action?: TransitionAction;
  context?: Partial<RaceContext>;
  source?: string;
  userIntent?: string;
  serverDecision?: string;
  details?: Record<string, any>;
}

export function logFSMEvent(
  event: string,
  details: Partial<FSMEvent> = {}
): void {
  const logEntry: FSMEvent = {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };

  console.log(`[FSM] ${event}`, logEntry);
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

export function createRaceContext(params: {
  currentStopIndex: number;
  totalStops: number;
  freeSeats: number;
  occupiedSeats: number;
  hasActiveReservations: boolean;
  queueSize: number;
  tripId: string;
}): RaceContext {
  return {
    ...params,
    isLastStop: params.currentStopIndex >= params.totalStops - 1,
  };
}

export function validateTransition(
  from: RaceState,
  action: TransitionAction,
  context: RaceContext
): { valid: boolean; error?: string; nextState?: RaceState } {
  const nextState = getNextState(from, action, context);

  if (!nextState) {
    const availableActions = getAvailableActions(from, context);
    return {
      valid: false,
      error: `Переход ${action} недопустим из состояния ${from}. Доступные действия: ${availableActions.join(", ")}`,
    };
  }

  return {
    valid: true,
    nextState,
  };
}
