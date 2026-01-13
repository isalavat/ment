import { ApplicationError } from "../lib/error";

export class InvalidEmailOrPasswordError extends ApplicationError {
	public readonly code = "INVALID_EMAIL_OR_PASSWORD";
	constructor() {
		super(`Invalid email or password.`);
	}
}
