import { prisma } from "../../prisma/client";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { CreatedUser } from "./createUserUseCase";

export const generateTokenUseCase = async (user: CreatedUser): Promise<{ accessToken: string, refreshToken: string }> => {
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

    return { accessToken, refreshToken }
}