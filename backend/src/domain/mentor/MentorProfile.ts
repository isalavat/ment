import { User } from "../user/User";

export class MentorProfile {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly bio: string,
    public readonly yearsExperience: number,
    public readonly hourlyRate: number,
    public readonly avgRating: number,
    public readonly currency: string,
    public totalReviews: number,
    public readonly user: User,
    public readonly skills: Array<{ skill: { id: string; name: string } }>,
    public readonly categories: Array<{
      category: { id: string; name: string; slug: string };
    }>
  ) {}

  static create(
    id: string,
    title: string,
    bio: string,
    yearsExperience: number,
    hourlyRate: number,
    avgRating: number,
    currency: string,
    totalReviews: number,
    user: User,
    skills: Array<{ skill: { id: string; name: string } }>,
    categories: Array<{
      category: { id: string; name: string; slug: string };
    }>
  ): MentorProfile {
    return new MentorProfile(
      id,
      title,
      bio,
      yearsExperience,
      hourlyRate,
      avgRating,
      currency,
      totalReviews,
      user,
      skills,
      categories
    );
  }
}
