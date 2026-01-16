import type { RefreshTokenRepository } from "../domain/token/RefreshTokenRepostory";

export class LogoutUserUseCase {
	constructor(private readonly refreshTokenRepositiry: RefreshTokenRepository) {}

	async execute(rawToken: string): Promise<void> {
		await this.refreshTokenRepositiry.revoke(rawToken);
	}
}
