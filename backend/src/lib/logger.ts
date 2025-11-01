import pino from "pino";

const transport = process.env.NODE_ENV === "development"
  ? { target: "pino-pretty", options: { colorize: true } }
  : undefined;

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info"
}, transport ? pino.transport(transport as any) : undefined);

export default logger;