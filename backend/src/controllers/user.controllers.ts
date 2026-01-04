import { Request, Response } from "express";
import { CreateUserDTO } from "../schemas/auth.schemas";
import { createUserUseCase } from "../use-cases/createUserUseCase";
import { generateTokenUseCase } from "../use-cases/generateTokenUseCase";

export const createUserController = async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
  const user = await createUserUseCase(req.body);
  const { accessToken, refreshToken } = await generateTokenUseCase(user);

  return res.status(201).json({
    accessToken,
    refreshToken,
    user,
  });

}