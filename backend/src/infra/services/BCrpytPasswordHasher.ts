import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../services/PasswordHasher";

export class BCrpytPasswordHasher implements PasswordHasher {
	async hash(password: string): Promise<string> {
		return await bcrypt.hash(password, 12);
	}
}
