import { ApplicationError } from "../lib/error";

export class UserAlreadyExistsError extends ApplicationError {
  public readonly code = 'APP_USER_EXISTS';
  constructor(email: string) {
    super(`A user with email "${email}" already exists in the system.`);
  }
}