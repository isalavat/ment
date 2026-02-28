import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class AddCategoryToMentorUseCase {
  constructor(private readonly mentorRepository: MentorProfileRepository) {}

  async execute(userId: string, categoryId: string): Promise<MentorProfile> {
    return this.mentorRepository.addCategory(userId, categoryId);
  }
}
