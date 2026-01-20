import { type Response, Router } from "express";
import {
  type AuthedRequest,
  requireAdmin,
  requireAuth,
} from "../../middleware/auth";
import { PrismaMentorRepository } from "../../infra/repositories/PrismaMentorProfileRepository";
import { ReadAllMentorsUseCase } from "../../use-cases/mentor/ReadAllMentorsUseCase";
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
