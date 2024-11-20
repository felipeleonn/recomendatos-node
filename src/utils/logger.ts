import winston from 'winston';

// Define el formato para los logs en la consola
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
  }),
);

// Define el formato para los logs en archivos (JSON)
const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.timestamp(),
  transports: [
    // Transporte para la consola con formato legible
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Transporte para archivos en formato JSON
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: fileFormat,
    }),
  ],
});

// Si no estás en producción, también registra en la consola con formato legible
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}
