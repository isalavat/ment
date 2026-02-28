import { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import {
  MenteeProfileRepository,
  CreateMenteeData,
} from "../../domain/mentee/MenteeProfileRepository";
import { UserRepository } from "../../domain/user/UserRepository";
import type { Transaction } from "../../Transaction";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/error";

export class CreateMenteeProfileUseCase {
  constructor(
    private readonly transaction: Transaction,
    private menteeProfileRepo: MenteeProfileRepository,
    private userRepo: UserRepository
  ) {}

  async execute(
    userId: string,
    data: CreateMenteeData
  ): Promise<MenteeProfile> {
    return this.transaction.run(async () => {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      if (user.role !== "MENTEE") {
        throw new BadRequestError("User must have MENTEE role");
      }
      const existing = await this.menteeProfileRepo.findByUserId(userId);
      if (existing) {
        throw new ConflictError("Mentee profile already exists");
      }
      return this.menteeProfileRepo.create(userId, data);
    });
  }
}
