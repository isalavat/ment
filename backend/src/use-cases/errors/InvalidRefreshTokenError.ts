import { StatusCodes } from "http-status-codes";
import { ApplicationError } from "../../lib/error";

export class InvalidRefreshTokenError extends ApplicationError {
	public readonly code = "INVALID_REFRESH_TOKEN";
	public override readonly statusCode: StatusCodes = StatusCodes.UNAUTHORIZED;

	constructor() {
		super("Refresh token signature is invalid");
	}
}
