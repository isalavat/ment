import { type Response, Router } from "express";
import {
  type AuthedRequest,
  requireAdmin,
  requireAuth,
} from "../../middleware/auth";
import { PrismaMentorRepository } from "../../infra/repositories/PrismaMentorProfileRepository";
import { ReadAllMentorsUseCase } from "../../use-cases/mentor/ReadAllMentorsUseCase";
import { ReadMentorByIdUseCase } from "../../use-cases/mentor/ReadMentorByIdUseCase";
import { ReadMentorByUserIdUseCase } from "../../use-cases/mentor/ReadMentorByUserIdUseCase";
import { UpdateMentorByUserIdUseCase } from "../../use-cases/mentor/UpdateMentorByUserIdUseCase";
import { CreateMentorProfileUseCase } from "../../use-cases/mentor/CreateMentorProfileUseCase";
import { AddSkillToMentorUseCase } from "../../use-cases/mentor/AddSkillToMentorUseCase";
import { RemoveSkillFromMentorUseCase } from "../../use-cases/mentor/RemoveSkillFromMentorUseCase";
import { AddCategoryToMentorUseCase } from "../../use-cases/mentor/AddCategoryToMentorUseCase";
import { RemoveCategoryFromMentorUseCase } from "../../use-cases/mentor/RemoveCategoryFromMentorUseCase";
import { PrismaSkillRepository } from "../../infra/repositories/PrismaSkillRepository";
import { PrismaUserRepository } from "../../infra/repositories/PrismaUserRepository";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { toMentorProfileDto } from "./dto/MentorProfileDto";
import { MentorProfile } from "../../domain/mentor/MentorProfile";

export const mentorController = Router();
mentorController.use(requireAuth, requireAdmin);

mentorController.get("/mentors", async (req: AuthedRequest, res: Response) => {
  const readAllUsersUseCase = new ReadAllMentorsUseCase(
    new PrismaMentorRepository()
  );
  const mentorProfiles: MentorProfile[] = await readAllUsersUseCase.execute();
  const mentorProfileDtos = mentorProfiles.map(toMentorProfileDto);
  return res.json({ mentorProfiles: mentorProfileDtos });
});

mentorController.get(
  "/mentors/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const useCase = new ReadMentorByUserIdUseCase(new PrismaMentorRepository());
    const mentorProfile = await useCase.execute(req.params.userId);
    if (!mentorProfile) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    return res.json({ mentorProfile: toMentorProfileDto(mentorProfile) });
  }
);

mentorController.get(
  "/mentors/:id",
  async (req: AuthedRequest, res: Response) => {
    const readMentorByIdUseCase = new ReadMentorByIdUseCase(
      new PrismaMentorRepository()
    );
    const mentorProfile = await readMentorByIdUseCase.execute(req.params.id);
    if (!mentorProfile) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    return res.json({ mentorProfile: toMentorProfileDto(mentorProfile) });
  }
);

mentorController.put(
  "/mentors/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const { bio, title, yearsExperience, hourlyRate, currency } = req.body;
    try {
      const useCase = new UpdateMentorByUserIdUseCase(
        new PrismaTransaction(),
        new PrismaMentorRepository()
      );
      const updated = await useCase.execute(req.params.userId, {
        bio,
        title,
        yearsExperience:
          yearsExperience !== undefined ? Number(yearsExperience) : undefined,
        hourlyRate: hourlyRate !== undefined ? Number(hourlyRate) : undefined,
        currency,
      });
      return res.json({ mentorProfile: toMentorProfileDto(updated) });
    } catch (err: any) {
      if (err.message === "Mentor profile not found") {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  }
);

mentorController.post(
  "/mentors/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const { bio, title, yearsExperience, hourlyRate, currency } = req.body;
    try {
      const useCase = new CreateMentorProfileUseCase(
        new PrismaTransaction(),
        new PrismaMentorRepository(),
        new PrismaUserRepository()
      );
      const created = await useCase.execute(req.params.userId, {
        bio,
        title,
        yearsExperience: Number(yearsExperience),
        hourlyRate: Number(hourlyRate),
        currency,
      });
      return res
        .status(201)
        .json({ mentorProfile: toMentorProfileDto(created) });
    } catch (err: any) {
      const status =
        err.message === "User not found"
          ? 404
          : err.message === "Mentor profile already exists"
          ? 409
          : err.message === "User must have MENTOR role"
          ? 400
          : 500;
      return res.status(status).json({ error: err.message });
    }
  }
);

mentorController.post(
  "/mentors/by-user/:userId/skills",
  async (req: AuthedRequest, res: Response) => {
    const { skillId, skillName } = req.body;
    try {
      const useCase = new AddSkillToMentorUseCase(
        new PrismaTransaction(),
        new PrismaMentorRepository(),
        new PrismaSkillRepository()
      );
      const updated = await useCase.execute(req.params.userId, {
        skillId,
        skillName,
      });
      return res.json({ mentorProfile: toMentorProfileDto(updated) });
    } catch (err: any) {
      const status =
        err.message === "Mentor profile not found"
          ? 404
          : err.message === "Skill already added to this mentor"
          ? 409
          : err.message === "Either skillId or skillName is required"
          ? 400
          : 500;
      return res.status(status).json({ error: err.message });
    }
  }
);

mentorController.delete(
  "/mentors/by-user/:userId/skills/:skillId",
  async (req: AuthedRequest, res: Response) => {
    try {
      const useCase = new RemoveSkillFromMentorUseCase(
        new PrismaMentorRepository()
      );
      await useCase.execute(req.params.userId, req.params.skillId);
      return res.json({ message: "Skill removed successfully" });
    } catch (err: any) {
      if (err.message === "Mentor profile not found") {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  }
);

mentorController.post(
  "/mentors/by-user/:userId/categories",
  async (req: AuthedRequest, res: Response) => {
    const { categoryId } = req.body;
    if (!categoryId)
      return res.status(400).json({ error: "Category ID is required" });
    try {
      const useCase = new AddCategoryToMentorUseCase(
        new PrismaMentorRepository()
      );
      const updated = await useCase.execute(req.params.userId, categoryId);
      return res.json({ mentorProfile: toMentorProfileDto(updated) });
    } catch (err: any) {
      const status =
        err.message === "Mentor profile not found"
          ? 404
          : err.message === "Category already added to this mentor"
          ? 409
          : 500;
      return res.status(status).json({ error: err.message });
    }
  }
);

mentorController.delete(
  "/mentors/by-user/:userId/categories/:categoryId",
  async (req: AuthedRequest, res: Response) => {
    try {
      const useCase = new RemoveCategoryFromMentorUseCase(
        new PrismaMentorRepository()
      );
      await useCase.execute(req.params.userId, req.params.categoryId);
      return res.json({ message: "Category removed successfully" });
    } catch (err: any) {
      if (err.message === "Mentor profile not found") {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  }
);
