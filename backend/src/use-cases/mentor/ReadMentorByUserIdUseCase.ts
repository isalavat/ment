import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class ReadMentorByUserIdUseCase {
	constructor(private mentorProfileRepo: MentorProfileRepository) {}

	async execute(userId: string): Promise<MentorProfile | null> {
		return this.mentorProfileRepo.findByUserId(userId);
	}
}
