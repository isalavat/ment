import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import { BadRequestError, NotFoundError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export type VerifyMentorInput = {
  mentorId: string;
  action: "verify" | "reject";
  rejectionReason?: string;
};

export class VerifyMentorUseCase {
  constructor(
    private readonly transaction: Transaction,
    private readonly mentorRepo: MentorProfileRepository,
  ) {}

  async execute(input: VerifyMentorInput): Promise<MentorProfile> {
    return this.transaction.run(async () => {
      const mentor = await this.mentorRepo.findById(input.mentorId);
      if (!mentor) {
        throw new NotFoundError("Mentor profile not found");
      }

      if (input.action === "verify") {
        if (mentor.categories.length === 0) {
          throw new BadRequestError(
            "Mentor must have at least one category before being verified",
          );
        }
        if (mentor.skills.length === 0) {
          throw new BadRequestError(
            "Mentor must have at least one skill before being verified",
          );
        }
        if (mentor.hourlyRate <= 0) {
          throw new BadRequestError(
            "Mentor must have a valid hourly rate before being verified",
          );
        }
        return this.mentorRepo.verifyMentor(input.mentorId, "VERIFIED");
      }

      return this.mentorRepo.verifyMentor(
        input.mentorId,
        "REJECTED",
        input.rejectionReason,
      );
    });
  }
}
