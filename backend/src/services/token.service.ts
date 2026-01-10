import { getPrismaClient } from "../infra/Prisma";
import { signAccessToken, signRefreshToken } from "../lib/jwt";

type UserInfo = { id: string, email: string }
export type Tokens = { accessToken: string, refreshToken: string }

export interface ITokenService {
    generate(info: UserInfo): Promise<Tokens>
}

export class JWTTokenService implements ITokenService {
    async generate(info: UserInfo): Promise<Tokens> {
        const accessToken = signAccessToken({ sub: info.id, email: info.email });
        const refreshToken = signRefreshToken({ sub: info.id, email: info.email });

        await getPrismaClient().refreshToken.create({ data: { token: refreshToken, userId: info.id } });

        return { accessToken, refreshToken };
    }

}