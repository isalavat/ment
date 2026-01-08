import { Response, Router, Request } from "express";
import { validateBody } from "../middleware/requestValidator";
import { CreateUserSchema } from "../schemas/auth.schemas";
import { CreateUserDTO, RegisterUserUseCase } from "../use-cases/register-user.use-case";
import { JWTTokenService } from "../services/token.service";
import { BCrpytPasswordHasher } from "../services/password-hasher";

const router = Router();

router.post(
    "/register",
    validateBody(CreateUserSchema),
    async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
        const dto = req.body;
        const useCase = new RegisterUserUseCase(
            new JWTTokenService(),
            new BCrpytPasswordHasher()
        );

        const { tokens, user } = await useCase.execute(dto);

        return res.status(201).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user,
        });
    }
);

export default router;