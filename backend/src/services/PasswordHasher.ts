import bcrypt from "bcryptjs";

export interface PasswordHasher {
	hash(password: string): Promise<string>;
}

export class BCrpytPasswordHasher implements PasswordHasher {
	async hash(password: string): Promise<string> {
		return await bcrypt.hash(password, 12);
	}
}
