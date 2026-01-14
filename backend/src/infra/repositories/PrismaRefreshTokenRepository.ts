import type { RefreshToken as PrismaRefreshToken } from "@prisma/client";
import { RefreshToken } from "../../domain/token/RefreshToken";
import type { RefreshTokenRepository } from "../../domain/token/RefreshTokenRepostory";
import { RefreshTokenId } from "../../domain/token/value-objects/RefreshTokenId";
import { UserId } from "../../domain/user/value-objects/UserId";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
	async save(refreshToken: RefreshToken): Promise<RefreshToken> {
		const result = await PrismaClientGetway().refreshToken.upsert({
			where: {
				id: refreshToken.id.value,
			},
			update: {
				revokedAt: refreshToken.revokedAt,
			},
			create: {
				id: refreshToken.id.value,
				token: refreshToken.token,
				userId: refreshToken.userId.value,
				revokedAt: refreshToken.revokedAt,
			},
		});
		return this.toRefreshToken(result);
	}

	async findByRawToken(rawToken: string): Promise<RefreshToken | null> {
		const result = await PrismaClientGetway().refreshToken.findUnique({
			where: {
				token: rawToken,
			},
		});
		return result ? this.toRefreshToken(result) : null;
	}

	private toRefreshToken(prismaResult: PrismaRefreshToken): RefreshToken {
		return RefreshToken.build(
			RefreshTokenId.fromString(prismaResult.id),
			prismaResult.token,
			UserId.fromString(prismaResult.userId),
			prismaResult.revokedAt,
		);
	}
}
