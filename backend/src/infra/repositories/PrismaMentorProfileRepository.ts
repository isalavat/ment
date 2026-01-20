import { MentorProfile } from "../../domain/mentor/MentorProfile";
import { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import { User } from "../../domain/user/User";
import { Email } from "../../domain/user/value-objects/Email";
import { HashedPassword } from "../../domain/user/value-objects/HashedPassword";
import { UserId } from "../../domain/user/value-objects/UserId";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaMentorRepository implements MentorProfileRepository {
  async findAllMentorProfiles(): Promise<MentorProfile[]> {
    const profiles = await PrismaClientGetway().mentorProfile.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return profiles.map((profile) => this.toMentorProfile(profile));
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
      fromPrisma.skills,
      fromPrisma.categories
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
