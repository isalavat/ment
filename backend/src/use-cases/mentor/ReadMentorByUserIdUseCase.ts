import { MentorProfile } from "../../domain/mentor/MentorProfile";
import { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class ReadMentorByUserIdUseCase {
  constructor(private mentorProfileRepo: MentorProfileRepository) {}

  async execute(userId: string): Promise<MentorProfile | null> {
    return this.mentorProfileRepo.findByUserId(userId);
  }
}
