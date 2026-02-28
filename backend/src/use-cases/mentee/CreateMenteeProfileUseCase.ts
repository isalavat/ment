import type { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import type { CreateMenteeData, MenteeProfileRepository } from "../../domain/mentee/MenteeProfileRepository";
import type { UserRepository } from "../../domain/user/UserRepository";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export class CreateMenteeProfileUseCase {
	constructor(
		private readonly transaction: Transaction,
		private menteeProfileRepo: MenteeProfileRepository,
		private userRepo: UserRepository,
	) {}

	async execute(userId: string, data: CreateMenteeData): Promise<MenteeProfile> {
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
