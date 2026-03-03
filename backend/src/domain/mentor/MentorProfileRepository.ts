import type { MentorProfile, VerificationStatus } from "./MentorProfile";

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

export type MentorFilters = {
	categorySlug?: string;
	skillName?: string;
	minRating?: number;
	minPrice?: number;
	maxPrice?: number;
	search?: string;
	verificationStatus?: VerificationStatus;
	requireAvailability?: boolean;
	page: number;
	limit: number;
};

export type PaginatedMentors = {
	mentors: MentorProfile[];
	total: number;
	page: number;
	limit: number;
};

export interface MentorProfileRepository {
	findAllMentorProfiles(verificationStatus?: VerificationStatus): Promise<MentorProfile[]>;
	findAllWithFilters(filters: MentorFilters): Promise<PaginatedMentors>;
	findById(id: string): Promise<MentorProfile | null>;
	findByUserId(userId: string): Promise<MentorProfile | null>;
	create(userId: string, data: CreateMentorData): Promise<MentorProfile>;
	updateByUserId(userId: string, data: UpdateMentorData): Promise<MentorProfile>;
	verifyMentor(mentorId: string, status: "VERIFIED" | "REJECTED", rejectionReason?: string): Promise<MentorProfile>;
	addSkill(userId: string, skillId: string): Promise<MentorProfile>;
	removeSkill(userId: string, skillId: string): Promise<void>;
	addCategory(userId: string, categoryId: string): Promise<MentorProfile>;
	removeCategory(userId: string, categoryId: string): Promise<void>;
}
