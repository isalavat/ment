import { type Request, type Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import z from "zod";
import { PrismaRefreshTokenRepository } from "../infra/repositories/PrismaRefreshTokenRepository";
import { validateBodyWith } from "../middleware/requestValidator";
import { LogoutUserUseCase } from "../use-cases/LogoutUserUseCase";

const LogoutUserSchema = z.strictObject({
	refreshToken: z.string(),
});

export const LogoutUserController = Router().post(
	"/logout",
	validateBodyWith(LogoutUserSchema),
	async (request: Request<unknown, unknown, z.infer<typeof LogoutUserSchema>>, response: Response) => {
		const refreshToken = request.body.refreshToken;
		const useCase = new LogoutUserUseCase(new PrismaRefreshTokenRepository());
		await useCase.execute(refreshToken);
		return response.status(StatusCodes.OK).json({ ok: true });
	},
);
