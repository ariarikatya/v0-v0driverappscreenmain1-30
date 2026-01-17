// lib/fsm-types.ts - ИСПРАВЛЕННАЯ АРХИТЕКТУРА FSM

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
// КОНТЕКСТ РЕЙСА - данные, необходимые для принятия решений
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
// РАЗРЕШЁННЫЕ ПЕРЕХОДЫ - явное описание FSM
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

// Описание перехода
export interface Transition {
  from: RaceState;
  to: RaceState;
  action: TransitionAction;
  guard?: (context: RaceContext) => boolean; // условие для перехода
}

// Граф переходов FSM
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
    guard: (ctx) => !ctx.isLastStop, // только если не последняя остановка
  },
  {
    from: "RACE_ARRIVED_STOP",
    to: "RACE_FINISHED",
    action: "finish_trip",
    guard: (ctx) => ctx.isLastStop, // только на последней остановке
  },
  {
    from: "RACE_FINISHED",
    to: "RACE_OFFLINE",
    action: "end_shift",
  },
];

// Валидация перехода
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

  // Проверяем guard если есть
  if (transition.guard && !transition.guard(context)) {
    return false;
  }

  return true;
}

// Получить следующее состояние
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

// Получить доступные действия для текущего состояния
export function getAvailableActions(
  currentState: RaceState,
  context: RaceContext
): TransitionAction[] {
  return FSM_TRANSITIONS.filter(
    (t) => t.from === currentState && (!t.guard || t.guard(context))
  ).map((t) => t.action);
}

// ============================================================================
// UI FSM СОСТОЯНИЯ (для кнопок)
// ============================================================================
export type UIFSMState = "idle" | "processing" | "success" | "error" | "disabled";

// ============================================================================
// РЕЖИМЫ ПАНЕЛЕЙ (не boolean!)
// ============================================================================
export type QueuePanelMode = "hidden" | "active" | "locked";
export type ReservationPanelMode = "hidden" | "waiting" | "confirming" | "expired";
export type CashPanelMode = "hidden" | "active";

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
export const RACE_STATE_TO_BUTTON: Record<RaceState, ButtonConfig> = {
  RACE_OFFLINE: {
    label: "Выйти на линию",
    action: "start_shift",
    enabled: true,
  },
  RACE_WAITING_START: {
    label: "Начать посадку",
    action: "start_boarding",
    enabled: true,
  },
  RACE_BOARDING: {
    label: "Отправиться",
    action: "depart_stop",
    enabled: true,
  },
  RACE_IN_TRANSIT: {
    label: "Прибыл",
    action: "arrive_stop",
    enabled: true,
  },
  RACE_ARRIVED_STOP: {
    label: "Продолжить",
    action: "continue_boarding",
    enabled: true,
  },
  RACE_FINISHED: {
    label: "Завершить рейс",
    action: "end_shift",
    enabled: true,
  },
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
        reservation: context.hasActiveReservations ? "waiting" : "hidden",
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
        mainButton: true,
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
// LEGACY МАППИНГ (для совместимости со старым кодом)
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
// ЛОГИРОВАНИЕ FSM СОБЫТИЙ
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

// Создать контекст из текущего состояния приложения
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

// Проверить, можно ли выполнить переход
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
