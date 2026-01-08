import { Response, Router, Request } from "express";
import { validateBody } from "../middleware/requestValidator";
import { CreateUserSchema } from "../schemas/auth.schemas";
import { CreateUserDTO, RegisterUserUseCase } from "../use-cases/register-user.use-case";
import { JWTTokenService } from "../services/token.service";

const router = Router();

router.post(
    "/register",
    validateBody(CreateUserSchema),
    async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
        const dto = req.body;
        const { tokens, user } = await new RegisterUserUseCase(new JWTTokenService()).execute(dto);

        return res.status(201).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user,
        });
    }
);

export default router;