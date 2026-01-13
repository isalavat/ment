import type { HashedPassword } from "../domain/user/value-objects/HashedPassword";

export interface PasswordHasher {
	hash(password: string): Promise<HashedPassword>;
	validate(password: string, hash: HashedPassword): Promise<boolean>;
}
