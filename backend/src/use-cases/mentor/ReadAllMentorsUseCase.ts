import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class ReadAllMentorsUseCase {
	constructor(private mentorProfileRepo: MentorProfileRepository) {}

	async execute(): Promise<MentorProfile[]> {
		const mentorProfiles: MentorProfile[] = await this.mentorProfileRepo.findAllMentorProfiles();
		return mentorProfiles;
	}
}
