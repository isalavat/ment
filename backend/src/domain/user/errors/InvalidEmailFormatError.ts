import { DomainError } from "../../../lib/error";

export class InvalidEmailFormatError extends DomainError {
	public code: string = "INVALID_EMAIL_FORMAT";

	constructor(email: string) {
		super(`The email format of "${email}" is invalid.`);
	}
}
