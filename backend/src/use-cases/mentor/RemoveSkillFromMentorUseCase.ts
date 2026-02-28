import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class RemoveSkillFromMentorUseCase {
	constructor(private readonly mentorRepository: MentorProfileRepository) {}

	async execute(userId: string, skillId: string): Promise<void> {
		await this.mentorRepository.removeSkill(userId, skillId);
	}
}
