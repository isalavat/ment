import type { RefreshTokenRepository } from "../domain/token/RefreshTokenRepostory";
import type { TokenService } from "../services/TokenService";
import type { Transaction } from "../Transaction";
import { InvalidRefreshTokenError } from "./errors/InvalidRefreshTokenError";
import { RefreshTokenRevokedError } from "./errors/RefreshTokenRevokedError";

type RotateSessionResult = {
	accessToken: string;
	refreshToken: string;
};

//Use standarded Refresh Token Rotation (RTR)
export class RotateSessionUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly refreshTokenRepository: RefreshTokenRepository,
		private readonly transaction: Transaction,
	) {}

	async execute(rawRefreshToken: string): Promise<RotateSessionResult> {
		return await this.transaction.run(async () => {
			const payload = this.tokenService.verify(rawRefreshToken);
			if (payload.type !== "refresh") {
				throw new InvalidRefreshTokenError();
			}

			const stored = await this.refreshTokenRepository.findByRawToken(rawRefreshToken);
			if (stored === null || stored.isRevoked) {
				throw new RefreshTokenRevokedError();
			}

			stored.revoke();
			await this.refreshTokenRepository.save(stored);

			const newTokens = this.tokenService.generate(payload.sub, payload.email);
			await this.refreshTokenRepository.save(newTokens.refreshToken);

			return { accessToken: newTokens.accessToken.toString(), refreshToken: newTokens.refreshToken.token };
		});
	}
}
