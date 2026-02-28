import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class RemoveCategoryFromMentorUseCase {
  constructor(private readonly mentorRepository: MentorProfileRepository) {}

  async execute(userId: string, categoryId: string): Promise<void> {
    await this.mentorRepository.removeCategory(userId, categoryId);
  }
}
