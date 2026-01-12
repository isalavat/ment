import pino from "pino";

const transport =
	process.env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true } } : undefined;

const logger = pino(
	{
		level: process.env.LOG_LEVEL ?? "info",
		formatters: {
			level: (label) => {
				return { level: label.toUpperCase() };
			},
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	transport ? pino.transport(transport) : undefined,
);

export default logger;
