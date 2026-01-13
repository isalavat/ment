import { signAccessToken, signRefreshToken } from "../../lib/jwt";
import type { TokenService, Tokens, UserInfoForToken } from "../../services/TokenService";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class JWTTokenService implements TokenService {
	async generate(info: UserInfoForToken): Promise<Tokens> {
		const accessToken = signAccessToken({ sub: info.id, email: info.email });
		const refreshToken = signRefreshToken({ sub: info.id, email: info.email });

		await PrismaClientGetway().refreshToken.create({ data: { token: refreshToken, userId: info.id } });

		return { accessToken, refreshToken };
	}
}
