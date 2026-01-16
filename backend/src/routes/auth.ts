import { Router } from "express";
import { LoginUserController } from "../controllers/LoginUserController";
import { LogoutUserController } from "../controllers/LogoutUserController";
import { RegisterUserController } from "../controllers/RegisterUserController";
import { RotateSessionController } from "../controllers/RotateSessionController";

const router = Router();

router.use(RegisterUserController);
router.use(LoginUserController);
router.use(RotateSessionController);
router.use(LogoutUserController);

export default router;
