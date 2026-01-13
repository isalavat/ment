import { type Request, type Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import z from "zod";
import { PrismaUserRepository } from "../infra/repositories/PrismaUserRepository";
import { BCrpytPasswordHasher } from "../infra/services/BCrpytPasswordHasher";
import { JWTTokenService } from "../infra/services/JWTTokenService";
import { PrismaTransaction } from "../infra/transaction/PrismaTransaction";
import { validateBodyWith } from "../middleware/requestValidator";
import { type LoginDTO, LoginUserUseCase } from "../use-cases/LoginUserUseCase";

const LoginSchema: z.ZodType<LoginDTO> = z.strictObject({
	email: z.email(),
	password: z.string(),
});

export const LoginUserController = Router().post(
	"/login",
	validateBodyWith(LoginSchema),
	async (req: Request<unknown, unknown, LoginDTO>, res: Response) => {
		const loginDto = req.body;
		const useCase = new LoginUserUseCase(
			new PrismaTransaction(),
			new PrismaUserRepository(),
			new BCrpytPasswordHasher(),
			new JWTTokenService(),
		);

		const { accessToken, refreshToken } = await useCase.execute(loginDto);

		return res.status(StatusCodes.OK).json({ accessToken, refreshToken });
	},
);
