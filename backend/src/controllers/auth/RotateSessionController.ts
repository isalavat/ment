import { type Request, type Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import z from "zod";
import { PrismaRefreshTokenRepository } from "../../infra/repositories/PrismaRefreshTokenRepository";
import { JWTTokenService } from "../../infra/services/JWTTokenService";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { validateBodyWith } from "../../middleware/requestValidator";
import { RotateSessionUseCase } from "../../use-cases/RotateSessionUseCase";

const RotateSessionSchema = z.strictObject({
  refreshToken: z.string(),
});

export const RotateSessionController = Router().post(
  "/refresh",
  validateBodyWith(RotateSessionSchema),
  async (
    req: Request<unknown, unknown, z.infer<typeof RotateSessionSchema>>,
    res: Response
  ) => {
    const rawRefreshToken = req.body.refreshToken;

    const useCase = new RotateSessionUseCase(
      new JWTTokenService(),
      new PrismaRefreshTokenRepository(),
      new PrismaTransaction()
    );

    const { accessToken, refreshToken } = await useCase.execute(
      rawRefreshToken
    );

    return res.status(StatusCodes.OK).json({ accessToken, refreshToken });
  }
);
