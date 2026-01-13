import { type Request, type Response, Router } from "express";
import { PrismaUserRepository } from "../infra/repositories/PrismaUserRepository";
import { PrismaTransaction } from "../infra/transaction/PrismaTransaction";
import { validateBodyWith } from "../middleware/requestValidator";
import { CreateUserSchema } from "../schemas/auth.schemas";
import { BCrpytPasswordHasher } from "../services/PasswordHasher";
import { JWTTokenService } from "../services/TokenService";
import { type CreateUserDTO, RegisterUserUseCase } from "../use-cases/RegisterUserUseCase";

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
