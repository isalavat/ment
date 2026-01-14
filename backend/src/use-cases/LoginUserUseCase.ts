import type { UserRepository } from "../domain/user/UserRepository";
import { Email } from "../domain/user/value-objects/Email";
import type { PasswordHasher } from "../services/PasswordHasher";
import type { TokenService } from "../services/TokenService";
import type { Transaction } from "../Transaction";
import { InvalidEmailOrPasswordError } from "./errors/InvalidEmailOrPasswordError";

export type LoginDTO = {
	email: string;
	password: string;
};

export type LoginResultDTO = {
	accessToken: string;
	refreshToken: string;
};

export class LoginUserUseCase {
	constructor(
		private readonly transaction: Transaction,
		private readonly userRepository: UserRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly tokenService: TokenService,
	) {}

	async execute({ email, password }: LoginDTO): Promise<LoginResultDTO> {
		return await this.transaction.run(async () => {
			const user = await this.userRepository.findByEmail(Email.from(email));

			const isPasswordValid = await this.passwordHasher.verify(password, user?.hashedPassword ?? null);

			if (user === null || !isPasswordValid) {
				throw new InvalidEmailOrPasswordError();
			}

			const { accessToken, refreshToken } = await this.tokenService.generate(user.id, user.email);

			return {
				accessToken,
				refreshToken,
			};
		});
	}
}
