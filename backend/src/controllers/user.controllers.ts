import { Request, Response } from "express";
import { CreateUserDTO } from "../schemas/auth.schemas";
import { prisma } from "../../prisma/client";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { createUserUseCase } from "../use-cases/createUserUseCase";

export const createUserController = async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
  const user = await createUserUseCase(req.body);

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

  return res.status(201).json({
    accessToken,
    refreshToken,
    user,
  });

}