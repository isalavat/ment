import { type Response, Router } from "express";
import {
  type AuthedRequest,
  requireAdmin,
  requireAuth,
} from "../../middleware/auth";
import { PrismaUserRepository } from "../../infra/repositories/PrismaUserRepository";
import { BCrpytPasswordHasher } from "../../infra/services/BCrpytPasswordHasher";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { AdminCreateUserUseCase } from "../../use-cases/admin/AdminCreateUserUseCase";
import { UpdateUserUseCase } from "../../use-cases/admin/UpdateUserUseCase";
import { DeleteUserUseCase } from "../../use-cases/admin/DeleteUserUseCase";
import { BadRequestError } from "../../lib/error";
import { toUserDto } from "../auth/dto/UserDto";

export const userController = Router();
userController.use(requireAuth, requireAdmin);

// POST create new user
userController.post("/users", async (req: AuthedRequest, res: Response) => {
  const { email, password, role, firstName, lastName, avatarUrl } = req.body;

  if (!email || !password || !role || !firstName || !lastName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["MENTEE", "MENTOR", "ADMIN"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const useCase = new AdminCreateUserUseCase(
      new PrismaTransaction(),
      new PrismaUserRepository(),
      new BCrpytPasswordHasher()
    );
    const user = await useCase.execute({
      email,
      password,
      firstName,
      lastName,
      role,
      avatarUrl,
    });
    return res.status(201).json({ user: toUserDto(user) });
  } catch (err: any) {
    if (
      err.code === "APP_USER_EXISTS" ||
      err.message?.includes("already exists")
    ) {
      return res.status(409).json({ error: "Email already in use" });
    }
    throw err;
  }
});

// PUT update user
userController.put("/users/:id", async (req: AuthedRequest, res: Response) => {
  const { email, password, role, firstName, lastName, avatarUrl } = req.body;

  const useCase = new UpdateUserUseCase(
    new PrismaTransaction(),
    new PrismaUserRepository(),
    new BCrpytPasswordHasher()
  );
  const user = await useCase.execute(req.params.id, {
    email,
    password,
    role,
    firstName,
    lastName,
    avatarUrl,
  });
  return res.json({ user: toUserDto(user) });
});

// DELETE user
userController.delete(
  "/users/:id",
  async (req: AuthedRequest, res: Response) => {
    const useCase = new DeleteUserUseCase(
      new PrismaTransaction(),
      new PrismaUserRepository()
    );
    await useCase.execute(req.user!.id, req.params.id);
    return res.json({ message: "User deleted successfully" });
  }
);
