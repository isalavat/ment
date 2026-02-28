import { MentorProfile } from "../../domain/mentor/MentorProfile";
import {
  MentorProfileRepository,
  UpdateMentorData,
  CreateMentorData,
} from "../../domain/mentor/MentorProfileRepository";
import { User } from "../../domain/user/User";
import { Email } from "../../domain/user/value-objects/Email";
import { HashedPassword } from "../../domain/user/value-objects/HashedPassword";
import { UserId } from "../../domain/user/value-objects/UserId";
import { PrismaClientGetway } from "../PrismaClientGetway";
import { ConflictError, NotFoundError } from "../../lib/error";

const mentorInclude = {
  user: true,
  skills: { include: { skill: true } },
  categories: { include: { category: true } },
} as const;

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

  async updateByUserId(
    userId: string,
    data: UpdateMentorData
  ): Promise<MentorProfile> {
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

  async findAllMentorProfiles(): Promise<MentorProfile[]> {
    const profiles = await PrismaClientGetway().mentorProfile.findMany({
      include: mentorInclude,
      orderBy: { createdAt: "desc" },
    });
    return profiles.map((profile) => this.toMentorProfile(profile));
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

  async addCategory(
    userId: string,
    categoryId: string
  ): Promise<MentorProfile> {
    const profile = await PrismaClientGetway().mentorProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundError("Mentor profile not found");

    const exists = await PrismaClientGetway().mentorCategory.findUnique({
      where: { mentorId_categoryId: { mentorId: profile.id, categoryId } },
    });
    if (exists)
      throw new ConflictError("Category already added to this mentor");

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

  private toMentorProfile(fromPrisma: any): MentorProfile {
    return MentorProfile.create(
      fromPrisma.id,
      fromPrisma.title,
      fromPrisma.bio,
      fromPrisma.yearsExperience,
      fromPrisma.hourlyRate,
      fromPrisma.avgRating,
      fromPrisma.currency,
      fromPrisma.totalReviews,
      this.toUser(fromPrisma.user),
      fromPrisma.skills ?? [],
      fromPrisma.categories ?? []
    );
  }

  private toUser(fromPrisma: any): User {
    return User.create(
      UserId.fromString(fromPrisma.id),
      Email.from(fromPrisma.email),
      fromPrisma.firstName,
      fromPrisma.lastName,
      HashedPassword.fromHash(fromPrisma.passwordHash),
      fromPrisma.role
    );
  }
}
