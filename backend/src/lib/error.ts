import { StatusCodes } from "http-status-codes";

export abstract class BaseError extends Error {
	public abstract readonly code: string;
	public abstract readonly statusCode: StatusCodes;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export abstract class DomainError extends BaseError {
	public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
}

export abstract class ApplicationError extends BaseError {
	public readonly statusCode = StatusCodes.CONFLICT;
}

export class InternalServerError extends BaseError {
	public code: string = "INTERNAL_SERVER_ERROR";
	public readonly statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
	public readonly details?: string;

	constructor(message: string, details?: string) {
		super(message);
		this.details = details;
	}
}
