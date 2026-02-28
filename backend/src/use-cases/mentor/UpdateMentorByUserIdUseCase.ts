import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository, UpdateMentorData } from "../../domain/mentor/MentorProfileRepository";
import { NotFoundError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export class UpdateMentorByUserIdUseCase {
	constructor(
		private readonly transaction: Transaction,
		private mentorProfileRepo: MentorProfileRepository,
	) {}

	async execute(userId: string, data: UpdateMentorData): Promise<MentorProfile> {
		return this.transaction.run(async () => {
			const existing = await this.mentorProfileRepo.findByUserId(userId);
			if (!existing) {
				throw new NotFoundError("Mentor profile not found");
			}
			return this.mentorProfileRepo.updateByUserId(userId, data);
		});
	}
}
