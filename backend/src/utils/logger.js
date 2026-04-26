/**
 * Winston Logger Configuration
 * Structured logging for the Election Education application
 */
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'election-education' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});

// Add file transport in production
// In serverless environments like Cloud Run, file logging is generally avoided
// as the filesystem is ephemeral and stdout/stderr are automatically captured
// by Cloud Logging. We will rely on the Console transport.
if (process.env.NODE_ENV === 'production') {
  // If structured JSON logging is needed for Cloud Logging,
  // it can be configured here on the Console transport.
}
