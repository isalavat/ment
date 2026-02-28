import type { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import type { MenteeProfileRepository } from "../../domain/mentee/MenteeProfileRepository";
import type { MentorProfile } from "../../domain/mentor/MentorProfile";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import type { User } from "../../domain/user/User";
import type { UserRepository } from "../../domain/user/UserRepository";
import { NotFoundError } from "../../lib/error";

export type MyProfileResult = {
	user: User;
	mentorProfile: MentorProfile | null;
	menteeProfile: MenteeProfile | null;
};

export class GetMyProfileUseCase {
	constructor(
		private readonly userRepo: UserRepository,
		private readonly mentorRepo: MentorProfileRepository,
		private readonly menteeRepo: MenteeProfileRepository,
	) {}

	async execute(userId: string): Promise<MyProfileResult> {
		const user = await this.userRepo.findById(userId);
		if (!user) throw new NotFoundError("User not found");

		const [mentorProfile, menteeProfile] = await Promise.all([
			this.mentorRepo.findByUserId(userId),
			this.menteeRepo.findByUserId(userId),
		]);

		return {
			user,
			mentorProfile: mentorProfile ?? null,
			menteeProfile: menteeProfile ?? null,
		};
	}
}
