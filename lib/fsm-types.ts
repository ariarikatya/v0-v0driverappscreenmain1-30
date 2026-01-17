// lib/fsm-types.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ

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
// РАЗРЕШЁННЫЕ ПЕРЕХОДЫ
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

export const ALLOWED_TRANSITIONS: Record<RaceState, TransitionAction[]> = {
  RACE_OFFLINE: ["start_shift"],
  RACE_WAITING_START: ["start_boarding"],
  RACE_BOARDING: ["depart_stop"],
  RACE_IN_TRANSIT: ["arrive_stop"],
  RACE_ARRIVED_STOP: ["continue_boarding", "finish_trip"],
  RACE_FINISHED: ["end_shift"],
};

export function canTransition(
  currentState: RaceState,
  action: TransitionAction
): boolean {
  return ALLOWED_TRANSITIONS[currentState].includes(action);
}

// ============================================================================
// UI FSM СОСТОЯНИЯ
// ============================================================================
export type UIFSMState = "idle" | "processing" | "success" | "error" | "disabled";

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
// ВИДИМОСТЬ ПАНЕЛЕЙ - ПРОСТАЯ СХЕМА (как было)
// ============================================================================
export interface PanelVisibility {
  mainButton: boolean;
  queue: boolean;      // вернул boolean как было!
  reservation: boolean; // вернул boolean как было!
  cash: boolean;       // вернул boolean как было!
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
// МАППИНГ: RaceState → PanelVisibility (КАК БЫЛО - РАБОТАЕТ!)
// ============================================================================
export const RACE_STATE_TO_PANELS: Record<RaceState, PanelVisibility> = {
  RACE_OFFLINE: {
    mainButton: true,
    queue: false,
    reservation: false,
    cash: false,
  },
  RACE_WAITING_START: {
    mainButton: true,
    queue: false,
    reservation: false,
    cash: false,
  },
  RACE_BOARDING: {
    mainButton: true,
    queue: true,
    reservation: true,
    cash: true,
  },
  RACE_IN_TRANSIT: {
    mainButton: true,
    queue: false,
    reservation: false,
    cash: false,
  },
  RACE_ARRIVED_STOP: {
    mainButton: true,
    queue: true,
    reservation: true,
    cash: true,
  },
  RACE_FINISHED: {
    mainButton: true,
    queue: false,
    reservation: false,
    cash: false,
  },
};

// ============================================================================
// LEGACY МАППИНГ
// ============================================================================
export const TRIP_STATUS_TO_RACE_STATE: Record<string, RaceState> = {
  "PREP_IDLE": "RACE_OFFLINE",
  "PREP_TIMER": "RACE_WAITING_START",
  "BOARDING": "RACE_BOARDING",
  "ROUTE_READY": "RACE_ARRIVED_STOP",
  "IN_ROUTE": "RACE_IN_TRANSIT",
  "FINISHED": "RACE_FINISHED",
};

// ============================================================================
// ЛОГИРОВАНИЕ
// ============================================================================
export const logFSMEvent = (
  event: string,
  details: Record<string, any>
) => {
  console.log(`[FSM] ${event}`, {
    ...details,
    timestamp: new Date().toISOString(),
  });
};
