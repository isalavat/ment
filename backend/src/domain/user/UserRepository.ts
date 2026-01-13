import type { User } from "./User";
import type { Email } from "./value-objects/Email";

export interface UserRepository {
	save(user: User): Promise<User>;
	existsByEmail(email: Email): Promise<boolean>;
	findByEmail(email: Email): Promise<User | null>;
}
