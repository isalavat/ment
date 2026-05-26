import { BadRequestError } from "../../lib/error";

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export function ensureValidTimeFormat(label: "startTime" | "endTime", value: string) {
	if (!TIME_REGEX.test(value)) {
		throw new BadRequestError(`Invalid ${label} format. Use HH:mm format`);
	}
}

export function ensureStartBeforeEnd(startTime: string, endTime: string) {
	if (startTime >= endTime) {
		throw new BadRequestError("Start time must be before end time");
	}
}

export function ensureValidDayOfWeek(dayOfWeek: number) {
	if (dayOfWeek < 0 || dayOfWeek > 6) {
		throw new BadRequestError("dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
	}
}
