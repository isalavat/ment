import { Router } from "express";
import { LoginUserController } from "../controllers/auth/LoginUserController";
import { LogoutUserController } from "../controllers/auth/LogoutUserController";
import { RegisterUserController } from "../controllers/auth/RegisterUserController";
import { RotateSessionController } from "../controllers/auth/RotateSessionController";

const router = Router();

router.use(RegisterUserController);
router.use(LoginUserController);
router.use(RotateSessionController);
router.use(LogoutUserController);

export default router;
