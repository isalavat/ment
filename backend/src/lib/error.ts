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