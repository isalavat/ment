import type { MentorProfile, VerificationStatus } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class ReadAllMentorsUseCase {
	constructor(private mentorProfileRepo: MentorProfileRepository) {}

	async execute(verificationStatus?: VerificationStatus): Promise<MentorProfile[]> {
		return this.mentorProfileRepo.findAllMentorProfiles(verificationStatus);
	}
}
