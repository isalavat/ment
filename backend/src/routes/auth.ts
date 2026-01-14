import { Router } from "express";
import { prisma } from "../../prisma/client";
import { LoginUserController } from "../controllers/LoginUserController";
import { RegisterUserController } from "../controllers/RegisterUserController";
import { RotateSessionController } from "../controllers/RotateSessionController";

const router = Router();

router.use(RegisterUserController);
router.use(LoginUserController);
router.use(RotateSessionController);

/** Logout (revoke a refresh token) */
router.post("/logout", async (req, res) => {
	const { refreshToken } = req.body ?? {};
	if (typeof refreshToken !== "string") return res.status(400).json({ error: "refreshToken required" });

	await prisma.refreshToken.updateMany({
		where: { token: refreshToken, revokedAt: null },
		data: { revokedAt: new Date() },
	});

	return res.json({ ok: true });
});

export default router;
