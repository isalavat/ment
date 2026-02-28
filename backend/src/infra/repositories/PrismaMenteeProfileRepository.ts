import { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import {
  MenteeProfileRepository,
  CreateMenteeData,
  UpdateMenteeData,
} from "../../domain/mentee/MenteeProfileRepository";
import { User } from "../../domain/user/User";
import { Email } from "../../domain/user/value-objects/Email";
import { HashedPassword } from "../../domain/user/value-objects/HashedPassword";
import { UserId } from "../../domain/user/value-objects/UserId";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaMenteeRepository implements MenteeProfileRepository {
  async findAll(): Promise<MenteeProfile[]> {
    const profiles = await PrismaClientGetway().menteeProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return profiles.map((profile) => this.toMenteeProfile(profile));
  }

  async findByUserId(userId: string): Promise<MenteeProfile | null> {
    const profile = await PrismaClientGetway().menteeProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) return null;
    return this.toMenteeProfile(profile);
  }

  async create(userId: string, data: CreateMenteeData): Promise<MenteeProfile> {
    const profile = await PrismaClientGetway().menteeProfile.create({
      data: {
        userId,
        bio: data.bio ?? null,
        goals: data.goals ?? null,
      },
      include: { user: true },
    });
    return this.toMenteeProfile(profile);
  }

  async updateByUserId(
    userId: string,
    data: UpdateMenteeData
  ): Promise<MenteeProfile> {
    const updated = await PrismaClientGetway().menteeProfile.update({
      where: { userId },
      data: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.goals !== undefined && { goals: data.goals }),
      },
      include: { user: true },
    });
    return this.toMenteeProfile(updated);
  }

  private toMenteeProfile(fromPrisma: any): MenteeProfile {
    return MenteeProfile.create(
      fromPrisma.id,
      fromPrisma.bio,
      fromPrisma.goals,
      this.toUser(fromPrisma.user)
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
