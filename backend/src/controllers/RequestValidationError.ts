import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { BaseError } from '../lib/error';

export class RequestValidationError extends BaseError {
  public readonly code = 'VALIDATION_FAILED';
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly errors: { name: string; reason: string }[];

  constructor(zodError: ZodError) {
    super('One or more validation errors occurred.');
    
    this.errors = zodError.issues.map(issue => ({
      name: issue.path.join('.'),
      reason: issue.message
    }));
  }
}