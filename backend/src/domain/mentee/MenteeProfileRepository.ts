import type { MenteeProfile } from "./MenteeProfile";

export type CreateMenteeData = {
	bio?: string;
	goals?: string;
};

export type UpdateMenteeData = {
	bio?: string;
	goals?: string;
};

export interface MenteeProfileRepository {
	findAll(): Promise<MenteeProfile[]>;
	findByUserId(userId: string): Promise<MenteeProfile | null>;
	create(userId: string, data: CreateMenteeData): Promise<MenteeProfile>;
	updateByUserId(userId: string, data: UpdateMenteeData): Promise<MenteeProfile>;
}
