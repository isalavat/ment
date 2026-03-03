import type { Prisma } from "@prisma/client";
import type { VerificationStatus } from "../../domain/mentor/MentorProfile";
import { MentorProfile } from "../../domain/mentor/MentorProfile";
import type {
	CreateMentorData,
	MentorFilters,
	MentorProfileRepository,
	PaginatedMentors,
	UpdateMentorData,
} from "../../domain/mentor/MentorProfileRepository";
import { User } from "../../domain/user/User";
import { Email } from "../../domain/user/value-objects/Email";
import { HashedPassword } from "../../domain/user/value-objects/HashedPassword";
import { UserId } from "../../domain/user/value-objects/UserId";
import { ConflictError, NotFoundError } from "../../lib/error";
import { PrismaClientGetway } from "../PrismaClientGetway";

const mentorInclude = {
	user: true,
	skills: { include: { skill: true } },
	categories: { include: { category: true } },
} as const;

type MentorRecord = Prisma.MentorProfileGetPayload<{
	include: typeof mentorInclude;
}>;
type PrismaUserRecord = MentorRecord["user"];

export class PrismaMentorRepository implements MentorProfileRepository {
	async findByUserId(userId: string): Promise<MentorProfile | null> {
		const profile = await PrismaClientGetway().mentorProfile.findUnique({
			where: { userId },
			include: mentorInclude,
		});
		if (!profile) return null;
		return this.toMentorProfile(profile);
	}

	async findById(id: string): Promise<MentorProfile | null> {
		const profile = await PrismaClientGetway().mentorProfile.findUnique({
			where: { id },
			include: mentorInclude,
		});
		if (!profile) return null;
		return this.toMentorProfile(profile);
	}

	async create(userId: string, data: CreateMentorData): Promise<MentorProfile> {
		const profile = await PrismaClientGetway().mentorProfile.create({
			data: {
				userId,
				bio: data.bio,
				title: data.title,
				yearsExperience: data.yearsExperience,
				hourlyRate: data.hourlyRate,
				currency: data.currency ?? "USD",
			},
			include: mentorInclude,
		});
		return this.toMentorProfile(profile);
	}

	async updateByUserId(userId: string, data: UpdateMentorData): Promise<MentorProfile> {
		const updated = await PrismaClientGetway().mentorProfile.update({
			where: { userId },
			data: {
				...(data.bio !== undefined && { bio: data.bio }),
				...(data.title !== undefined && { title: data.title }),
				...(data.yearsExperience !== undefined && {
					yearsExperience: data.yearsExperience,
				}),
				...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
				...(data.currency !== undefined && { currency: data.currency }),
			},
			include: mentorInclude,
		});
		return this.toMentorProfile(updated);
	}

	async findAllMentorProfiles(verificationStatus?: VerificationStatus): Promise<MentorProfile[]> {
		const profiles = await PrismaClientGetway().mentorProfile.findMany({
			where: verificationStatus ? { verificationStatus } : undefined,
			include: mentorInclude,
			orderBy: { createdAt: "desc" },
		});
		return profiles.map((profile) => this.toMentorProfile(profile));
	}

	async findAllWithFilters(filters: MentorFilters): Promise<PaginatedMentors> {
		const {
			categorySlug,
			skillName,
			minRating,
			minPrice,
			maxPrice,
			search,
			verificationStatus,
			requireAvailability,
			page,
			limit,
		} = filters;
		const skip = (page - 1) * limit;

		const where: Prisma.MentorProfileWhereInput = {};

		if (verificationStatus) {
			where.verificationStatus = verificationStatus;
		}
		if (requireAvailability) {
			where.availabilities = { some: {} };
		}
		if (minRating !== undefined) {
			where.avgRating = { gte: minRating };
		}
		if (minPrice !== undefined || maxPrice !== undefined) {
			where.hourlyRate = {
				...(minPrice !== undefined && { gte: minPrice }),
				...(maxPrice !== undefined && { lte: maxPrice }),
			};
		}
		if (categorySlug) {
			where.categories = { some: { category: { slug: categorySlug } } };
		}
		if (skillName) {
			where.skills = { some: { skill: { name: { contains: skillName } } } };
		}
		if (search) {
			where.OR = [
				{ title: { contains: search } },
				{ bio: { contains: search } },
				{
					user: {
						OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }],
					},
				},
			];
		}

		const [profiles, total] = await Promise.all([
			PrismaClientGetway().mentorProfile.findMany({
				where,
				skip,
				take: limit,
				include: mentorInclude,
				orderBy: { avgRating: "desc" },
			}),
			PrismaClientGetway().mentorProfile.count({ where }),
		]);

		return {
			mentors: profiles.map((p) => this.toMentorProfile(p)),
			total,
			page,
			limit,
		};
	}

	async verifyMentor(
		mentorId: string,
		status: "VERIFIED" | "REJECTED",
		rejectionReason?: string,
	): Promise<MentorProfile> {
		const updated = await PrismaClientGetway().mentorProfile.update({
			where: { id: mentorId },
			data: {
				verificationStatus: status,
				rejectionReason: status === "REJECTED" ? (rejectionReason ?? null) : null,
			},
			include: mentorInclude,
		});
		return this.toMentorProfile(updated);
	}

	async addSkill(userId: string, skillId: string): Promise<MentorProfile> {
		const profile = await PrismaClientGetway().mentorProfile.findUnique({
			where: { userId },
		});
		if (!profile) throw new NotFoundError("Mentor profile not found");

		const exists = await PrismaClientGetway().mentorSkill.findUnique({
			where: { mentorId_skillId: { mentorId: profile.id, skillId } },
		});
		if (exists) throw new ConflictError("Skill already added to this mentor");

		await PrismaClientGetway().mentorSkill.create({
			data: { mentorId: profile.id, skillId },
		});

		const updated = await PrismaClientGetway().mentorProfile.findUniqueOrThrow({
			where: { id: profile.id },
			include: mentorInclude,
		});
		return this.toMentorProfile(updated);
	}

	async removeSkill(userId: string, skillId: string): Promise<void> {
		const profile = await PrismaClientGetway().mentorProfile.findUnique({
			where: { userId },
		});
		if (!profile) throw new NotFoundError("Mentor profile not found");

		await PrismaClientGetway().mentorSkill.delete({
			where: { mentorId_skillId: { mentorId: profile.id, skillId } },
		});
	}

	async addCategory(userId: string, categoryId: string): Promise<MentorProfile> {
		const profile = await PrismaClientGetway().mentorProfile.findUnique({
			where: { userId },
		});
		if (!profile) throw new NotFoundError("Mentor profile not found");

		const exists = await PrismaClientGetway().mentorCategory.findUnique({
			where: { mentorId_categoryId: { mentorId: profile.id, categoryId } },
		});
		if (exists) throw new ConflictError("Category already added to this mentor");

		await PrismaClientGetway().mentorCategory.create({
			data: { mentorId: profile.id, categoryId },
		});

		const updated = await PrismaClientGetway().mentorProfile.findUniqueOrThrow({
			where: { id: profile.id },
			include: mentorInclude,
		});
		return this.toMentorProfile(updated);
	}

	async removeCategory(userId: string, categoryId: string): Promise<void> {
		const profile = await PrismaClientGetway().mentorProfile.findUnique({
			where: { userId },
		});
		if (!profile) throw new NotFoundError("Mentor profile not found");

		await PrismaClientGetway().mentorCategory.delete({
			where: { mentorId_categoryId: { mentorId: profile.id, categoryId } },
		});
	}

	private toMentorProfile(fromPrisma: MentorRecord): MentorProfile {
		return MentorProfile.create(
			fromPrisma.id,
			fromPrisma.title,
			fromPrisma.bio,
			fromPrisma.yearsExperience,
			fromPrisma.hourlyRate.toNumber(),
			fromPrisma.avgRating,
			fromPrisma.currency,
			fromPrisma.totalReviews,
			this.toUser(fromPrisma.user),
			fromPrisma.skills ?? [],
			fromPrisma.categories ?? [],
			fromPrisma.verificationStatus as VerificationStatus,
			fromPrisma.rejectionReason ?? null,
		);
	}

	private toUser(fromPrisma: PrismaUserRecord): User {
		return User.create(
			UserId.fromString(fromPrisma.id),
			Email.from(fromPrisma.email),
			fromPrisma.firstName,
			fromPrisma.lastName,
			HashedPassword.fromHash(fromPrisma.passwordHash),
			fromPrisma.role,
		);
	}
}
