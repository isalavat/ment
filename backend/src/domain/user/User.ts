import type { Email } from "./value-objects/Email";
import type { HashedPassword } from "./value-objects/HashedPassword";
import type { UserId } from "./value-objects/UserId";

export type UserRole = "USER" | "MENTOR" | "ADMIN";

export class User {
	private constructor(
		public readonly id: UserId,
		public readonly email: Email,
		public readonly firstName: string,
		public readonly lastName: string,
		public readonly hashedPassword: HashedPassword,
		public readonly role: UserRole,
		public readonly avatarUrl: string | null = null,
		public readonly bio: string | null = null,
		public readonly goals: string | null = null,
	) {}

	static create(
		id: UserId,
		email: Email,
		firstName: string,
		lastName: string,
		hashedPassword: HashedPassword,
		role: UserRole,
		avatarUrl: string | null = null,
		bio: string | null = null,
		goals: string | null = null,
	) {
		return new User(id, email, firstName, lastName, hashedPassword, role, avatarUrl, bio, goals);
	}
}
