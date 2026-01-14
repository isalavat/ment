import type { RefreshToken } from "../domain/token/RefreshToken";
import type { AccessToken } from "../domain/token/value-objects/AccessToken";
import type { Email } from "../domain/user/value-objects/Email";
import type { UserId } from "../domain/user/value-objects/UserId";

export type Tokens = { accessToken: AccessToken; refreshToken: RefreshToken };
export type TokenPayload = {
	sub: UserId;
	email: Email;
	type: "access" | "refresh";
};

export interface TokenService {
	generate(userId: UserId, email: Email): Tokens;
	verify(rawRefreshToken: string): TokenPayload;
}
