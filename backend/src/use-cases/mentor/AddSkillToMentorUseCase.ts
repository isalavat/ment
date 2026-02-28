import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import type { SkillRepository } from "../../domain/skill/SkillRepository";
import { BadRequestError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export class AddSkillToMentorUseCase {
	constructor(
		private readonly transaction: Transaction,
		private readonly mentorRepository: MentorProfileRepository,
		private readonly skillRepository: SkillRepository,
	) {}

	async execute(userId: string, input: { skillId?: string; skillName?: string }): Promise<MentorProfile> {
		return this.transaction.run(async () => {
			let skillId = input.skillId;

			if (input.skillName) {
				let skill = await this.skillRepository.findByName(input.skillName);
				if (!skill) {
					skill = await this.skillRepository.create(input.skillName);
				}
				skillId = skill.id;
			}

			if (!skillId) {
				throw new BadRequestError("Either skillId or skillName is required");
			}

			return this.mentorRepository.addSkill(userId, skillId);
		});
	}
}
