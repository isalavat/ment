import type { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import type { MenteeProfileRepository } from "../../domain/mentee/MenteeProfileRepository";

export class ReadMenteeByUserIdUseCase {
  constructor(private readonly menteeRepository: MenteeProfileRepository) {}

  async execute(userId: string): Promise<MenteeProfile | null> {
    return this.menteeRepository.findByUserId(userId);
  }
}
