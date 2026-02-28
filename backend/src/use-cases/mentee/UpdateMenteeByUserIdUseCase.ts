import type { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import type { MenteeProfileRepository, UpdateMenteeData } from "../../domain/mentee/MenteeProfileRepository";
import { NotFoundError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export class UpdateMenteeByUserIdUseCase {
	constructor(
		private readonly transaction: Transaction,
		private readonly menteeRepository: MenteeProfileRepository,
	) {}

	async execute(userId: string, data: UpdateMenteeData): Promise<MenteeProfile> {
		return this.transaction.run(async () => {
			const existing = await this.menteeRepository.findByUserId(userId);
			if (!existing) throw new NotFoundError("Mentee profile not found");
			return this.menteeRepository.updateByUserId(userId, data);
		});
	}
}
