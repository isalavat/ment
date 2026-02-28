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
import { BadRequestError, NotFoundError } from "../../lib/error";
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
    if (!mentorProfile) throw new NotFoundError("Mentor not found");
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
    if (!mentorProfile) throw new NotFoundError("Mentor not found");
    return res.json({ mentorProfile: toMentorProfileDto(mentorProfile) });
  }
);

mentorController.put(
  "/mentors/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const { bio, title, yearsExperience, hourlyRate, currency } = req.body;
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
  }
);

mentorController.post(
  "/mentors/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const { bio, title, yearsExperience, hourlyRate, currency } = req.body;
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
    return res.status(201).json({ mentorProfile: toMentorProfileDto(created) });
  }
);

mentorController.post(
  "/mentors/by-user/:userId/skills",
  async (req: AuthedRequest, res: Response) => {
    const { skillId, skillName } = req.body;
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
  }
);

mentorController.delete(
  "/mentors/by-user/:userId/skills/:skillId",
  async (req: AuthedRequest, res: Response) => {
    const useCase = new RemoveSkillFromMentorUseCase(
      new PrismaMentorRepository()
    );
    await useCase.execute(req.params.userId, req.params.skillId);
    return res.json({ message: "Skill removed successfully" });
  }
);

mentorController.post(
  "/mentors/by-user/:userId/categories",
  async (req: AuthedRequest, res: Response) => {
    const { categoryId } = req.body;
    if (!categoryId) throw new BadRequestError("Category ID is required");
    const useCase = new AddCategoryToMentorUseCase(
      new PrismaMentorRepository()
    );
    const updated = await useCase.execute(req.params.userId, categoryId);
    return res.json({ mentorProfile: toMentorProfileDto(updated) });
  }
);

mentorController.delete(
  "/mentors/by-user/:userId/categories/:categoryId",
  async (req: AuthedRequest, res: Response) => {
    const useCase = new RemoveCategoryFromMentorUseCase(
      new PrismaMentorRepository()
    );
    await useCase.execute(req.params.userId, req.params.categoryId);
    return res.json({ message: "Category removed successfully" });
  }
);
