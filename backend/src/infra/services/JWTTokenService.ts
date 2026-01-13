import type { Email } from "../../domain/user/value-objects/Email";
import type { UserId } from "../../domain/user/value-objects/UserId";
import { signAccessToken, signRefreshToken } from "../../lib/jwt";
import type { TokenService, Tokens } from "../../services/TokenService";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class JWTTokenService implements TokenService {
	async generate(userId: UserId, email: Email): Promise<Tokens> {
		const accessToken = signAccessToken({ sub: userId.value, email: email.value });
		const refreshToken = signRefreshToken({ sub: userId.value, email: email.value });

		await PrismaClientGetway().refreshToken.create({ data: { token: refreshToken, userId: userId.value } });

		return { accessToken, refreshToken };
	}
}
