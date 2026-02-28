import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { CreateMentorData, MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import type { UserRepository } from "../../domain/user/UserRepository";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export class CreateMentorProfileUseCase {
	constructor(
		private readonly transaction: Transaction,
		private mentorProfileRepo: MentorProfileRepository,
		private userRepo: UserRepository,
	) {}

	async execute(userId: string, data: CreateMentorData): Promise<MentorProfile> {
		return this.transaction.run(async () => {
			const user = await this.userRepo.findById(userId);
			if (!user) {
				throw new NotFoundError("User not found");
			}
			if (user.role !== "MENTOR") {
				throw new BadRequestError("User must have MENTOR role");
			}
			const existing = await this.mentorProfileRepo.findByUserId(userId);
			if (existing) {
				throw new ConflictError("Mentor profile already exists");
			}
			return this.mentorProfileRepo.create(userId, data);
		});
	}
}
