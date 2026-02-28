import { MentorProfile } from "../../domain/mentor/MentorProfile";
import {
  MentorProfileRepository,
  UpdateMentorData,
} from "../../domain/mentor/MentorProfileRepository";

export class UpdateMentorByUserIdUseCase {
  constructor(private mentorProfileRepo: MentorProfileRepository) {}

  async execute(
    userId: string,
    data: UpdateMentorData
  ): Promise<MentorProfile> {
    const existing = await this.mentorProfileRepo.findByUserId(userId);
    if (!existing) {
      throw new Error("Mentor profile not found");
    }
    return this.mentorProfileRepo.updateByUserId(userId, data);
  }
}
