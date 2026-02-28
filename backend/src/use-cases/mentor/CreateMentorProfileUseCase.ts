import { MentorProfile } from "../../domain/mentor/MentorProfile";
import {
  MentorProfileRepository,
  CreateMentorData,
} from "../../domain/mentor/MentorProfileRepository";
import { UserRepository } from "../../domain/user/UserRepository";

export class CreateMentorProfileUseCase {
  constructor(
    private mentorProfileRepo: MentorProfileRepository,
    private userRepo: UserRepository
  ) {}

  async execute(
    userId: string,
    data: CreateMentorData
  ): Promise<MentorProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.role !== "MENTOR") {
      throw new Error("User must have MENTOR role");
    }
    const existing = await this.mentorProfileRepo.findByUserId(userId);
    if (existing) {
      throw new Error("Mentor profile already exists");
    }
    return this.mentorProfileRepo.create(userId, data);
  }
}
