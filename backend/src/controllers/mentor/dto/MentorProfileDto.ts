import type { MentorProfile, VerificationStatus } from "../../../domain/mentor/MentorProfile";
import type { UserDto } from "../../auth/dto/UserDto";
import { toUserDto } from "../../auth/dto/UserDto";

export interface MentorProfileDto {
	id: string;
	title: string;
	bio: string;
	yearsExperience: number;
	hourlyRate: number;
	avgRating: number;
	currency: string;
	totalReviews: number;
	verificationStatus: VerificationStatus;
	rejectionReason: string | null;
	user: UserDto;
	skills: Array<{ skill: { id: string; name: string } }>;
	categories: Array<{
		category: { id: string; name: string; slug: string };
	}>;
}

export function toMentorProfileDto(profile: MentorProfile): MentorProfileDto {
	return {
		id: profile.id,
		title: profile.title,
		bio: profile.bio,
		yearsExperience: profile.yearsExperience,
		hourlyRate: profile.hourlyRate,
		avgRating: profile.avgRating,
		currency: profile.currency,
		totalReviews: profile.totalReviews,
		verificationStatus: profile.verificationStatus,
		rejectionReason: profile.rejectionReason,
		user: toUserDto(profile.user),
		skills: profile.skills,
		categories: profile.categories,
	};
}
