/**
 * Simple logger utility
 * In production, consider using winston or pino for advanced logging
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};

module.exports = logger;
