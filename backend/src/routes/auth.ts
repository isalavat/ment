import { Router } from "express";
import { prisma } from "../../prisma/client";
import { LoginUserController } from "../controllers/LoginUserController";
import { RegisterUserController } from "../controllers/RegisterUserController";
import { type AppJwtPayload, signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";

const router = Router();

router.use(RegisterUserController);
router.use(LoginUserController);

/** Refresh */
router.post("/refresh", async (req, res) => {
	const { refreshToken } = req.body ?? {};
	if (typeof refreshToken !== "string") return res.status(400).json({ error: "refreshToken required" });

	// Verify structure/signature
	let payload: AppJwtPayload;
	try {
		payload = verifyRefreshToken(refreshToken);
		if (payload.type !== "refresh") throw new Error("wrong type");
	} catch {
		return res.status(401).json({ error: "Invalid refresh token" });
	}

	// Check token exists (not revoked)
	const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
	if (!stored || stored.revokedAt) return res.status(401).json({ error: "Refresh token revoked" });

	// Rotate: revoke old, issue new pair
	await prisma.refreshToken.update({
		where: { id: stored.id },
		data: { revokedAt: new Date() },
	});

	const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });
	const newRefresh = signRefreshToken({ sub: payload.sub, email: payload.email });
	await prisma.refreshToken.create({ data: { token: newRefresh, userId: payload.sub } });

	return res.json({ accessToken, refreshToken: newRefresh });
});

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
