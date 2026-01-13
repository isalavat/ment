import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BaseError, InternalServerError } from "../lib/error";
import logger from "../lib/logger";
import type { AuthedRequest } from "./auth";
import { RequestValidationError } from "./RequestValidationError";

export const ErrorHandler = (err: BaseError, req: AuthedRequest, res: Response, _next: NextFunction) => {
	const isUnexpected = !(err instanceof BaseError);

	const logLevel = err.statusCode >= 500 || isUnexpected ? "error" : "warn";

	const logContext = {
		correlationId: req.headers["x-correlation-id"],
		user: req.user ? { id: req.user.id } : null,
		request: {
			method: req.method,
			url: req.url,
		},
		error: {
			code: err.code || "INTERNAL_SERVER_ERROR",
			message: err.message,
			stack: logLevel === "error" ? err.stack : undefined,
			validationErrorDetails: err instanceof RequestValidationError ? err.errors : undefined,
			detailedMessage: err instanceof InternalServerError ? err.details : undefined,
		},
	};

	logger[logLevel](logContext, `Request failed: ${err.message}`);

	res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
		code: err.code || "INTERNAL_SERVER_ERROR",
		message: err.message,
		instance: req.url,
	});
};
