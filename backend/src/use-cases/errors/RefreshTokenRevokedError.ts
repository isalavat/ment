import { StatusCodes } from "http-status-codes";
import { ApplicationError } from "../../lib/error";

export class RefreshTokenRevokedError extends ApplicationError {
	public readonly code = "REFRESH_TOKEN_REVOKED";
	public override readonly statusCode: StatusCodes = StatusCodes.UNAUTHORIZED;

	constructor() {
		super("Refresh token is revoked");
	}
}
