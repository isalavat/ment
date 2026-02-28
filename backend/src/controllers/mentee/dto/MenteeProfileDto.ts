import type { MenteeProfile } from "../../../domain/mentee/MenteeProfile";
import { toUserDto, type UserDto } from "../../auth/dto/UserDto";

export interface MenteeProfileDto {
	id: string;
	bio: string | null;
	goals: string | null;
	user: UserDto;
}

export function toMenteeProfileDto(profile: MenteeProfile): MenteeProfileDto {
	return {
		id: profile.id,
		bio: profile.bio,
		goals: profile.goals,
		user: toUserDto(profile.user),
	};
}
