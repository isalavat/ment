import { type Request, type Response, Router } from "express";
import { PrismaTransaction } from "../infra/Prisma";
import { PrismaUserRepository } from "../infra/PrismaUserRepository";
import { validateBodyWith } from "../middleware/requestValidator";
import { CreateUserSchema } from "../schemas/auth.schemas";
import { BCrpytPasswordHasher } from "../services/password-hasher";
import { JWTTokenService } from "../services/token.service";
import { type CreateUserDTO, RegisterUserUseCase } from "../use-cases/register-user.use-case";

export const RegisterUserController = Router().post(
	"/register",
	validateBodyWith(CreateUserSchema),
	async (req: Request<unknown, unknown, CreateUserDTO>, res: Response) => {
		const dto = req.body;
		const useCase = new RegisterUserUseCase(
			new PrismaTransaction(),
			new PrismaUserRepository(),
			new JWTTokenService(),
			new BCrpytPasswordHasher(),
		);

		const { tokens, user } = await useCase.execute(dto);

		return res.status(201).json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			user,
		});
	},
);
