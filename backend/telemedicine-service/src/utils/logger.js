import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

const formatLine = printf(({ level, message, timestamp: time }) =>
  `${time} ${level}: ${message}`
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), formatLine),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), formatLine)
    })
  ]
});

export default logger;
