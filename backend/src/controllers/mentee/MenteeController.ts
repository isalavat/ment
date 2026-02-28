import { type Response, Router } from "express";
import {
  type AuthedRequest,
  requireAdmin,
  requireAuth,
} from "../../middleware/auth";
import { PrismaMenteeRepository } from "../../infra/repositories/PrismaMenteeProfileRepository";
import { PrismaUserRepository } from "../../infra/repositories/PrismaUserRepository";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { NotFoundError } from "../../lib/error";
import { ReadAllMenteesUseCase } from "../../use-cases/mentee/ReadAllMenteesUseCase";
import { ReadMenteeByUserIdUseCase } from "../../use-cases/mentee/ReadMenteeByUserIdUseCase";
import { CreateMenteeProfileUseCase } from "../../use-cases/mentee/CreateMenteeProfileUseCase";
import { UpdateMenteeByUserIdUseCase } from "../../use-cases/mentee/UpdateMenteeByUserIdUseCase";
import { toMenteeProfileDto } from "./dto/MenteeProfileDto";

export const menteeController = Router();
menteeController.use(requireAuth, requireAdmin);

menteeController.get("/mentees", async (req: AuthedRequest, res: Response) => {
  const useCase = new ReadAllMenteesUseCase(new PrismaMenteeRepository());
  const menteeProfiles = await useCase.execute();
  const dtos = menteeProfiles.map(toMenteeProfileDto);
  return res.json({ menteeProfiles: dtos });
});

menteeController.get(
  "/mentees/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const useCase = new ReadMenteeByUserIdUseCase(new PrismaMenteeRepository());
    const menteeProfile = await useCase.execute(req.params.userId);
    if (!menteeProfile) throw new NotFoundError("Mentee not found");
    return res.json({ menteeProfile: toMenteeProfileDto(menteeProfile) });
  }
);

menteeController.post(
  "/mentees/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const { bio, goals } = req.body;
    const useCase = new CreateMenteeProfileUseCase(
      new PrismaTransaction(),
      new PrismaMenteeRepository(),
      new PrismaUserRepository()
    );
    const created = await useCase.execute(req.params.userId, { bio, goals });
    return res.status(201).json({ menteeProfile: toMenteeProfileDto(created) });
  }
);

menteeController.put(
  "/mentees/by-user/:userId",
  async (req: AuthedRequest, res: Response) => {
    const { bio, goals } = req.body;
    const useCase = new UpdateMenteeByUserIdUseCase(
      new PrismaTransaction(),
      new PrismaMenteeRepository()
    );
    const updated = await useCase.execute(req.params.userId, { bio, goals });
    return res.json({ menteeProfile: toMenteeProfileDto(updated) });
  }
);
