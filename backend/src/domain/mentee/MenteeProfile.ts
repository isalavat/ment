import { User } from "../user/User";

export class MenteeProfile {
  private constructor(
    public readonly id: string,
    public readonly bio: string | null,
    public readonly goals: string | null,
    public readonly user: User
  ) {}

  static create(
    id: string,
    bio: string | null,
    goals: string | null,
    user: User
  ): MenteeProfile {
    return new MenteeProfile(id, bio, goals, user);
  }
}
