import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import logger from "../lib/logger";
import { prisma } from "../../prisma/client";
import { CreateUserDTO, CreateUserSchema } from "../schemas/auth.schemas";
import { validateBody } from "../middleware/requestValidator";

const router = Router();

router.post("/register",
  validateBody(CreateUserSchema),
  async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
    const { email, password, role, firstName, lastName } = req.body;

    try {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(409).json({ error: "Email already in use" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
          firstName,
          lastName
        }
      });

      const accessToken = signAccessToken({ sub: user.id, email: user.email });
      const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

      await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

      return res.status(201).json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ error: (error as Error).message });
    }

  });

// ...existing code...
router.post("/login", async (req, res) => {
  logger.info("Salavat");
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

  return res.json({ accessToken, refreshToken });
});

/** Refresh */
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== "string") return res.status(400).json({ error: "refreshToken required" });

  // Verify structure/signature
  let payload;
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