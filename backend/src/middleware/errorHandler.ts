import { NextFunction, Response } from "express";
import { BaseError } from "../lib/error";
import logger from "../lib/logger";
import { AuthedRequest } from "./auth";
import { StatusCodes } from "http-status-codes";
import { RequestValidationError } from "../controllers/RequestValidationError";

export const errorHandler = (err: BaseError, req: AuthedRequest, res: Response, _next: NextFunction) => {
    const isUnexpected = !(err instanceof BaseError);

    const logLevel = (err.statusCode >= 500 || isUnexpected) ? 'error' : 'warn';

    const logContext = {
        correlationId: req.headers['x-correlation-id'],
        user: req.user ? { id: req.user.id } : null,
        request: {
            method: req.method,
            url: req.url,
        },
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message,
            stack: logLevel === 'error' ? err.stack : undefined,
            validationErrorDetails: err instanceof RequestValidationError ? err.errors : undefined
        }
    };

    logger[logLevel](logContext, `Request failed: ${err.message}`);

    res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message,
        instance: req.url,
    });
}