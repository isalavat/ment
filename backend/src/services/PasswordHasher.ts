import type { HashedPassword } from "../domain/user/value-objects/HashedPassword";

export interface PasswordHasher {
	hash(password: string): Promise<HashedPassword>;
	verify(password: string, hash: HashedPassword | null): Promise<boolean>;
}
