import type { RefreshToken } from "./RefreshToken";

export type RefreshTokenRepository = {
	save(refreshToken: RefreshToken): Promise<RefreshToken>;
	findByRawToken(rawToken: string): Promise<RefreshToken | null>;
	revoke(rawToken: string): Promise<void>;
};
