import type { Prisma, UserRole } from "@prisma/client";
import { type Response, Router } from "express";
import { PrismaClientGetway } from "../../infra/PrismaClientGetway";
import { PrismaUserRepository } from "../../infra/repositories/PrismaUserRepository";
import { BCrpytPasswordHasher } from "../../infra/services/BCrpytPasswordHasher";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { ForbiddenError, NotFoundError } from "../../lib/error";
import { type AuthedRequest, requireAdmin, requireAuth } from "../../middleware/auth";
import { AdminCreateUserUseCase } from "../../use-cases/admin/AdminCreateUserUseCase";
import { DeleteUserUseCase } from "../../use-cases/admin/DeleteUserUseCase";
import { UpdateUserUseCase } from "../../use-cases/admin/UpdateUserUseCase";
import { toUserDto } from "../auth/dto/UserDto";

export const userController = Router();
userController.use(requireAuth, requireAdmin);

// GET all users with pagination and filtering
userController.get("/users", async (req: AuthedRequest, res: Response) => {
	const { role, page = "1", limit = "20", search } = req.query as Record<string, string>;
	const pageNum = parseInt(page, 10);
	const limitNum = parseInt(limit, 10);
	const skip = (pageNum - 1) * limitNum;

	const where: Prisma.UserWhereInput = {};
	if (role && ["MENTEE", "MENTOR", "ADMIN"].includes(role)) {
		where.role = role as UserRole;
	}
	if (search) {
		where.OR = [
			{ email: { contains: search } },
			{ firstName: { contains: search } },
			{ lastName: { contains: search } },
		];
	}

	const [users, total] = await Promise.all([
		PrismaClientGetway().user.findMany({
			where,
			skip,
			take: limitNum,
			select: {
				id: true,
				email: true,
				role: true,
				firstName: true,
				lastName: true,
				avatarUrl: true,
				createdAt: true,
				mentorProfile: {
					select: { id: true, title: true, hourlyRate: true, avgRating: true },
				},
				menteeProfile: { select: { id: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
		PrismaClientGetway().user.count({ where }),
	]);

	return res.json({
		users,
		pagination: {
			page: pageNum,
			limit: limitNum,
			total,
			totalPages: Math.ceil(total / limitNum),
		},
	});
});

// GET single user by ID
userController.get("/users/:id", async (req: AuthedRequest, res: Response) => {
	const user = await PrismaClientGetway().user.findUnique({
		where: { id: req.params.id },
		include: {
			mentorProfile: {
				include: {
					categories: { include: { category: true } },
					skills: { include: { skill: true } },
				},
			},
			menteeProfile: true,
		},
	});
	if (!user) throw new NotFoundError("User not found");
	return res.json({ user });
});

// POST create new user
userController.post("/users", async (req: AuthedRequest, res: Response) => {
	const { email, password, role, firstName, lastName, avatarUrl } = req.body;

	if (!email || !password || !role || !firstName || !lastName) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	if (!["MENTEE", "MENTOR", "ADMIN"].includes(role)) {
		return res.status(400).json({ error: "Invalid role" });
	}

	const useCase = new AdminCreateUserUseCase(
		new PrismaTransaction(),
		new PrismaUserRepository(),
		new BCrpytPasswordHasher(),
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
});

// PUT update user
userController.put("/users/:id", async (req: AuthedRequest, res: Response) => {
	const { email, password, role, firstName, lastName, avatarUrl } = req.body;

	const useCase = new UpdateUserUseCase(
		new PrismaTransaction(),
		new PrismaUserRepository(),
		new BCrpytPasswordHasher(),
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
userController.delete("/users/:id", async (req: AuthedRequest, res: Response) => {
	const useCase = new DeleteUserUseCase(new PrismaTransaction(), new PrismaUserRepository());
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	await useCase.execute(req.user.id, req.params.id);
	return res.json({ message: "User deleted successfully" });
});
