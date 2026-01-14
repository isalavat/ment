import { RefreshToken } from "../../domain/token/RefreshToken";
import { AccessToken } from "../../domain/token/value-objects/AccessToken";
import { RefreshTokenId } from "../../domain/token/value-objects/RefreshTokenId";
import { Email } from "../../domain/user/value-objects/Email";
import { UserId } from "../../domain/user/value-objects/UserId";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import type { TokenPayload, TokenService, Tokens } from "../../services/TokenService";

export class JWTTokenService implements TokenService {
	generate(userId: UserId, email: Email): Tokens {
		const accessToken = signAccessToken({ sub: userId.value, email: email.value });
		const refreshToken = signRefreshToken({ sub: userId.value, email: email.value });

		return {
			accessToken: AccessToken.create(accessToken),
			refreshToken: RefreshToken.build(RefreshTokenId.generate(), refreshToken, userId, null),
		};
	}

	verify(rawRefreshToken: string): TokenPayload {
		const { sub, email, type } = verifyRefreshToken(rawRefreshToken);
		return {
			sub: UserId.fromString(sub),
			email: Email.from(email),
			type,
		};
	}
}
