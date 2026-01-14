import bcrypt from "bcryptjs";
import { HashedPassword } from "../../domain/user/value-objects/HashedPassword";
import type { PasswordHasher } from "../../services/PasswordHasher";

export class BCrpytPasswordHasher implements PasswordHasher {
	private readonly saltRounds: number = 12;
	private readonly DUMMY_HASH: string = "$2b$12$N3jHAVK5ahBDSyfCrng.vePNGVIOOE0dcaLNa.9kM6RdKnaNPuSzi";

	async hash(password: string): Promise<HashedPassword> {
		return HashedPassword.fromHash(await bcrypt.hash(password, this.saltRounds));
	}
	async verify(password: string, hash: HashedPassword | null): Promise<boolean> {
		return await bcrypt.compare(password, hash?.value ?? this.DUMMY_HASH);
	}
}
