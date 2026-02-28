import { MentorProfile } from "../../domain/mentor/MentorProfile";
import {
  MentorProfileRepository,
  UpdateMentorData,
} from "../../domain/mentor/MentorProfileRepository";
import type { Transaction } from "../../Transaction";
import { NotFoundError } from "../../lib/error";

export class UpdateMentorByUserIdUseCase {
  constructor(
    private readonly transaction: Transaction,
    private mentorProfileRepo: MentorProfileRepository
  ) {}

  async execute(
    userId: string,
    data: UpdateMentorData
  ): Promise<MentorProfile> {
    return this.transaction.run(async () => {
      const existing = await this.mentorProfileRepo.findByUserId(userId);
      if (!existing) {
        throw new NotFoundError("Mentor profile not found");
      }
      return this.mentorProfileRepo.updateByUserId(userId, data);
    });
  }
}
