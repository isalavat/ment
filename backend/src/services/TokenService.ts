import type { Email } from "../domain/user/value-objects/Email";
import type { UserId } from "../domain/user/value-objects/UserId";

type Tokens = { accessToken: string; refreshToken: string };

export interface TokenService {
	generate(userId: UserId, email: Email): Promise<Tokens>;
}
