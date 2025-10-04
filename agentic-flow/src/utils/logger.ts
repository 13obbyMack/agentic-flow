// Structured logging utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  agent?: string;
  task?: string;
  duration?: number;
  error?: unknown;
  [key: string]: any;
}

class Logger {
  private context: Record<string, any> = {};

  setContext(ctx: Record<string, any>) {
    this.context = { ...this.context, ...ctx };
  }

  private log(level: LogLevel, message: string, data?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...data
    };

    // Structured JSON logging for production
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      // Human-readable for development
      const prefix = `[${timestamp}] ${level.toUpperCase()}`;
      const contextStr = Object.keys({ ...this.context, ...data }).length > 0
        ? ` ${JSON.stringify({ ...this.context, ...data })}`
        : '';
      console.log(`${prefix}: ${message}${contextStr}`);
    }
  }

  debug(message: string, data?: LogContext) {
    this.log('debug', message, data);
  }

  info(message: string, data?: LogContext) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogContext) {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogContext) {
    this.log('error', message, data);
  }
}

export const logger = new Logger();
