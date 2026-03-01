import { type Response, Router } from "express";
import { PrismaCategoryRepository } from "../../infra/repositories/PrismaCategoryRepository";
import { PrismaMenteeRepository } from "../../infra/repositories/PrismaMenteeProfileRepository";
import { PrismaMentorRepository } from "../../infra/repositories/PrismaMentorProfileRepository";
import { PrismaSkillRepository } from "../../infra/repositories/PrismaSkillRepository";
import { PrismaUserRepository } from "../../infra/repositories/PrismaUserRepository";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { ForbiddenError, NotFoundError } from "../../lib/error";
import { type AuthedRequest, requireAuth } from "../../middleware/auth";
import { ReadAllCategoriesUseCase } from "../../use-cases/category/ReadAllCategoriesUseCase";
import { CreateMenteeProfileUseCase } from "../../use-cases/mentee/CreateMenteeProfileUseCase";
import { UpdateMenteeByUserIdUseCase } from "../../use-cases/mentee/UpdateMenteeByUserIdUseCase";
import { AddCategoryToMentorUseCase } from "../../use-cases/mentor/AddCategoryToMentorUseCase";
import { AddSkillToMentorUseCase } from "../../use-cases/mentor/AddSkillToMentorUseCase";
import { CreateMentorProfileUseCase } from "../../use-cases/mentor/CreateMentorProfileUseCase";
import { ReadAllMentorsWithFiltersUseCase } from "../../use-cases/mentor/ReadAllMentorsWithFiltersUseCase";
import { ReadMentorByIdUseCase } from "../../use-cases/mentor/ReadMentorByIdUseCase";
import { RemoveCategoryFromMentorUseCase } from "../../use-cases/mentor/RemoveCategoryFromMentorUseCase";
import { RemoveSkillFromMentorUseCase } from "../../use-cases/mentor/RemoveSkillFromMentorUseCase";
import { UpdateMentorByUserIdUseCase } from "../../use-cases/mentor/UpdateMentorByUserIdUseCase";
import { GetMyProfileUseCase } from "../../use-cases/profile/GetMyProfileUseCase";
import { ReadAllSkillsUseCase } from "../../use-cases/skill/ReadAllSkillsUseCase";
import { toUserDto } from "../auth/dto/UserDto";
import { toMenteeProfileDto } from "../mentee/dto/MenteeProfileDto";
import { toMentorProfileDto } from "../mentor/dto/MentorProfileDto";

export const profileController = Router();

// GET /me — current user's full profile
profileController.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const useCase = new GetMyProfileUseCase(
		new PrismaUserRepository(),
		new PrismaMentorRepository(),
		new PrismaMenteeRepository(),
	);
	const { user, mentorProfile, menteeProfile } = await useCase.execute(req.user.id);
	return res.json({
		user: {
			...toUserDto(user),
			mentorProfile: mentorProfile ? toMentorProfileDto(mentorProfile) : null,
			menteeProfile: menteeProfile ? toMenteeProfileDto(menteeProfile) : null,
		},
	});
});

// GET /mentors — public listing with filters
profileController.get("/mentors", async (req, res: Response) => {
	const {
		category,
		skill,
		rating,
		minPrice,
		maxPrice,
		search,
		page = "1",
		limit = "9",
	} = req.query as Record<string, string>;
	const useCase = new ReadAllMentorsWithFiltersUseCase(new PrismaMentorRepository());
	const result = await useCase.execute({
		categorySlug: category,
		skillName: skill,
		minRating: rating !== undefined ? parseFloat(rating) : undefined,
		minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
		maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
		search,
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
	});
	return res.json({
		mentors: result.mentors.map(toMentorProfileDto),
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: Math.ceil(result.total / result.limit),
		},
	});
});

// GET /mentors/:id — public single mentor
profileController.get("/mentors/:id", async (req, res: Response) => {
	const useCase = new ReadMentorByIdUseCase(new PrismaMentorRepository());
	const mentorProfile = await useCase.execute(req.params.id);
	if (!mentorProfile) throw new NotFoundError("Mentor not found");
	return res.json({ mentor: toMentorProfileDto(mentorProfile) });
});

// POST /mentor — create mentor profile for the logged-in user
profileController.post("/mentor", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const { bio, title, yearsExperience, hourlyRate, currency } = req.body;
	const useCase = new CreateMentorProfileUseCase(
		new PrismaTransaction(),
		new PrismaMentorRepository(),
		new PrismaUserRepository(),
	);
	const profile = await useCase.execute(req.user.id, {
		bio,
		title,
		yearsExperience: Number(yearsExperience),
		hourlyRate: parseFloat(hourlyRate),
		currency,
	});
	return res.status(201).json({ profile: toMentorProfileDto(profile) });
});

// PUT /mentor — update mentor profile for the logged-in user
profileController.put("/mentor", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const { bio, title, yearsExperience, hourlyRate, currency } = req.body;
	const useCase = new UpdateMentorByUserIdUseCase(new PrismaTransaction(), new PrismaMentorRepository());
	const profile = await useCase.execute(req.user.id, {
		bio,
		title,
		yearsExperience: yearsExperience !== undefined ? Number(yearsExperience) : undefined,
		hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : undefined,
		currency,
	});
	return res.json({ profile: toMentorProfileDto(profile) });
});

// POST /mentee — create mentee profile for the logged-in user
profileController.post("/mentee", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const { bio, goals } = req.body;
	const useCase = new CreateMenteeProfileUseCase(
		new PrismaTransaction(),
		new PrismaMenteeRepository(),
		new PrismaUserRepository(),
	);
	const profile = await useCase.execute(req.user.id, { bio, goals });
	return res.status(201).json({ profile: toMenteeProfileDto(profile) });
});

// PUT /mentee — update mentee profile for the logged-in user
profileController.put("/mentee", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const { bio, goals } = req.body;
	const useCase = new UpdateMenteeByUserIdUseCase(new PrismaTransaction(), new PrismaMenteeRepository());
	const profile = await useCase.execute(req.user.id, { bio, goals });
	return res.json({ profile: toMenteeProfileDto(profile) });
});

// GET /categories — public list of all categories
profileController.get("/categories", async (_req, res: Response) => {
	const useCase = new ReadAllCategoriesUseCase(new PrismaCategoryRepository());
	const categories = await useCase.execute();
	return res.json({ categories });
});

// GET /skills — public list of all skills
profileController.get("/skills", async (_req, res: Response) => {
	const useCase = new ReadAllSkillsUseCase(new PrismaSkillRepository());
	const skills = await useCase.execute();
	return res.json({ skills });
});

// POST /mentor/categories — add a category to the logged-in mentor
profileController.post("/mentor/categories", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const { categoryId } = req.body;
	const useCase = new AddCategoryToMentorUseCase(new PrismaMentorRepository());
	const updated = await useCase.execute(req.user.id, categoryId);
	return res.json({
		message: "Category added successfully",
		profile: toMentorProfileDto(updated),
	});
});

// DELETE /mentor/categories/:categoryId — remove a category from the logged-in mentor
profileController.delete("/mentor/categories/:categoryId", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const useCase = new RemoveCategoryFromMentorUseCase(new PrismaMentorRepository());
	await useCase.execute(req.user.id, req.params.categoryId);
	return res.json({ message: "Category removed successfully" });
});

// POST /mentor/skills — add a skill to the logged-in mentor
profileController.post("/mentor/skills", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const { skillId, skillName } = req.body;
	const useCase = new AddSkillToMentorUseCase(
		new PrismaTransaction(),
		new PrismaMentorRepository(),
		new PrismaSkillRepository(),
	);
	const updated = await useCase.execute(req.user.id, { skillId, skillName });
	return res.json({ profile: toMentorProfileDto(updated) });
});

// DELETE /mentor/skills/:skillId — remove a skill from the logged-in mentor
profileController.delete("/mentor/skills/:skillId", requireAuth, async (req: AuthedRequest, res: Response) => {
	if (!req.user?.id) throw new ForbiddenError("Not authenticated");
	const useCase = new RemoveSkillFromMentorUseCase(new PrismaMentorRepository());
	await useCase.execute(req.user.id, req.params.skillId);
	return res.json({ message: "Skill removed successfully" });
});
