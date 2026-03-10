type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private level: LogLevel = 'info'

  debug(message: string, ...args: any[]) {
    console.debug(`[DEBUG] ${message}`, ...args)
  }

  info(message: string, ...args: any[]) {
    console.info(`[INFO] ${message}`, ...args)
  }

  ui(message: string, ...args: any[]) {
    console.log(`[UI] ${message}`, ...args)
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${message}`, ...args)
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args)
  }
}

export const logger = new Logger()
