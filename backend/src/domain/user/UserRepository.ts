import type { User } from "./User";
import type { Email } from "./value-objects/Email";

export type UpdateProfileData = {
	bio?: string | null;
	goals?: string | null;
};

export interface UserRepository {
	save(user: User): Promise<User>;
	existsByEmail(email: Email): Promise<boolean>;
	findByEmail(email: Email): Promise<User | null>;
	findById(id: string): Promise<User | null>;
	update(user: User): Promise<User>;
	updateProfile(userId: string, data: UpdateProfileData): Promise<User>;
	delete(id: string): Promise<void>;
}
