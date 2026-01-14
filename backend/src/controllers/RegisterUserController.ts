import { type Request, type Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import z from "zod";
import { PrismaRefreshTokenRepository } from "../infra/repositories/PrismaRefreshTokenRepository";
import { PrismaUserRepository } from "../infra/repositories/PrismaUserRepository";
import { BCrpytPasswordHasher } from "../infra/services/BCrpytPasswordHasher";
import { JWTTokenService } from "../infra/services/JWTTokenService";
import { PrismaTransaction } from "../infra/transaction/PrismaTransaction";
import { validateBodyWith } from "../middleware/requestValidator";
import { type CreateUserDTO, RegisterUserUseCase } from "../use-cases/RegisterUserUseCase";

const CreateUserSchema: z.ZodType<CreateUserDTO> = z.strictObject({
	email: z.email(),
	password: z.string(),
	firstName: z.string("first name is required"),
	lastName: z.string(),
	role: z.literal(["MENTEE", "MENTOR", "ADMIN"]),
});

export const RegisterUserController = Router().post(
	"/register",
	validateBodyWith(CreateUserSchema),
	async (req: Request<unknown, unknown, CreateUserDTO>, res: Response) => {
		const createUserDto = req.body;
		const useCase = new RegisterUserUseCase(
			new PrismaTransaction(),
			new PrismaUserRepository(),
			new JWTTokenService(),
			new BCrpytPasswordHasher(),
			new PrismaRefreshTokenRepository(),
		);

		const { tokens, user } = await useCase.execute(createUserDto);

		return res.status(StatusCodes.CREATED).json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			user,
		});
	},
);
