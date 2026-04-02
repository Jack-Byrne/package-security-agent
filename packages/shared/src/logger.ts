import winston from 'winston';

export interface LogContext {
  correlationId?: string;
  component?: string;
  [key: string]: any;
}

export class Logger {
  private logger: winston.Logger;

  constructor(private defaultContext: LogContext = {}) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  private log(level: string, message: string, context?: LogContext) {
    this.logger.log(level, message, {
      ...this.defaultContext,
      ...context,
    });
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

// Made with Bob
