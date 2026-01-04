import { Request, Response } from "express";
import { CreateUserDTO } from "../schemas/auth.schemas";
import { signUpService } from "../services/signUpService";

export const signUpController = async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
  const { accessToken, refreshToken, user } = await signUpService.execute(req.body);

  return res.status(201).json({
    accessToken,
    refreshToken,
    user,
  });

}