import bcrypt from "bcryptjs";
import { HashedPassword } from "../../domain/user/value-objects/HashedPassword";
import type { PasswordHasher } from "../../services/PasswordHasher";

export class BCrpytPasswordHasher implements PasswordHasher {
	async hash(password: string): Promise<HashedPassword> {
		return HashedPassword.fromHash(await bcrypt.hash(password, 12));
	}
	async validate(password: string, hash: HashedPassword): Promise<boolean> {
		return await bcrypt.compare(password, hash.value);
	}
}
