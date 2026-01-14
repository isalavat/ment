import type { RefreshTokenRepository } from "../domain/token/RefreshTokenRepostory";
import { User, type UserRole } from "../domain/user/User";
import type { UserRepository } from "../domain/user/UserRepository";
import { Email } from "../domain/user/value-objects/Email";
import { UserId } from "../domain/user/value-objects/UserId";
import type { PasswordHasher } from "../services/PasswordHasher";
import type { TokenService } from "../services/TokenService";
import type { Transaction } from "../Transaction";
import { UserAlreadyExistsError } from "./errors/UserAlreadyExistsError";

export type CreateUserDTO = {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	role: UserRole;
};

type RegisteredUser = {
	user: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		role: UserRole;
	};
	tokens: {
		accessToken: string;
		refreshToken: string;
	};
};

export class RegisterUserUseCase {
	constructor(
		private readonly transaction: Transaction,
		private readonly userRepository: UserRepository,
		private readonly tokenService: TokenService,
		private readonly passwordHasher: PasswordHasher,
		private readonly refreshTokenRepository: RefreshTokenRepository,
	) {}

	async execute(dto: CreateUserDTO): Promise<RegisteredUser> {
		return await this.transaction.run(async () => {
			const email = Email.from(dto.email);
			const existed = await this.userRepository.existsByEmail(email);

			if (existed) {
				throw new UserAlreadyExistsError(email.value);
			}

			const hashedPassword = await this.passwordHasher.hash(dto.password);

			const user = User.create(UserId.generate(), email, dto.firstName, dto.lastName, hashedPassword, dto.role);
			await this.userRepository.save(user);

			const { accessToken, refreshToken } = this.tokenService.generate(user.id, user.email);
			await this.refreshTokenRepository.save(refreshToken);

			return {
				user: {
					id: user.id.value,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email.value,
					role: user.role,
				},
				tokens: {
					accessToken: accessToken.toString(),
					refreshToken: refreshToken.token,
				},
			};
		});
	}
}
