import { DomainError } from "../../../lib/error";

export class InvalidRefreshTokenIdFormatError extends DomainError {
	public code: string = "INVALID_REFRESH_TOKEN_ID_FORMAT";

	constructor() {
		super(`The User Id format is invalid. It must be a valid UUID v4.`);
	}
}
