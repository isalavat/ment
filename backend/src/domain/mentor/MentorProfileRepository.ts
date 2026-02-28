import type { MentorProfile } from "./MentorProfile";

export type CreateMentorData = {
	bio: string;
	title: string;
	yearsExperience: number;
	hourlyRate: number;
	currency?: string;
};

export type UpdateMentorData = {
	bio?: string;
	title?: string;
	yearsExperience?: number;
	hourlyRate?: number;
	currency?: string;
};

export interface MentorProfileRepository {
	findAllMentorProfiles(): Promise<MentorProfile[]>;
	findById(id: string): Promise<MentorProfile | null>;
	findByUserId(userId: string): Promise<MentorProfile | null>;
	create(userId: string, data: CreateMentorData): Promise<MentorProfile>;
	updateByUserId(userId: string, data: UpdateMentorData): Promise<MentorProfile>;
	addSkill(userId: string, skillId: string): Promise<MentorProfile>;
	removeSkill(userId: string, skillId: string): Promise<void>;
	addCategory(userId: string, categoryId: string): Promise<MentorProfile>;
	removeCategory(userId: string, categoryId: string): Promise<void>;
}
