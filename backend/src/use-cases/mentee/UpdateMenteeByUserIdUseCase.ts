import type { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import type {
  MenteeProfileRepository,
  UpdateMenteeData,
} from "../../domain/mentee/MenteeProfileRepository";

export class UpdateMenteeByUserIdUseCase {
  constructor(private readonly menteeRepository: MenteeProfileRepository) {}

  async execute(
    userId: string,
    data: UpdateMenteeData
  ): Promise<MenteeProfile> {
    const existing = await this.menteeRepository.findByUserId(userId);
    if (!existing) throw new Error("Mentee profile not found");
    return this.menteeRepository.updateByUserId(userId, data);
  }
}
