import { Request, Response } from "express";
import { CreateUserDTO } from "../schemas/auth.schemas";
import { prisma } from "../../prisma/client";
import bcrypt from "bcryptjs/umd/types";
import { signAccessToken, signRefreshToken } from "../lib/jwt";

export const createUserController = async (req: Request<{}, {}, CreateUserDTO>, res: Response) => {
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

  }