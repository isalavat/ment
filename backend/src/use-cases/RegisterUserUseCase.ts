import { User, type UserRole } from "../domain/user/User";
import type { UserRepository } from "../domain/user/UserRepository";
import { Email } from "../domain/user/value-objects/Email";
import { UserId } from "../domain/user/value-objects/UserId";
import type { PasswordHasher } from "../services/PasswordHasher";
import type { TokenService, Tokens } from "../services/TokenService";
import type { Transaction } from "../Transaction";
import { UserAlreadyExistsError } from "./UserAlreadyExistsError";

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
	tokens: Tokens;
};

export class RegisterUserUseCase {
	constructor(
		private readonly transaction: Transaction,
		private readonly userRepository: UserRepository,
		private readonly tokenService: TokenService,
		private readonly hasher: PasswordHasher,
	) {}

	async execute(dto: CreateUserDTO): Promise<RegisteredUser> {
		return await this.transaction.run(async () => {
			const email = Email.from(dto.email);
			const existed = await this.userRepository.existsByEmail(email);

			if (existed) {
				throw new UserAlreadyExistsError(email.value);
			}

			const hashedPassword = await this.hasher.hash(dto.password);

			const user = User.create(UserId.generate(), email, dto.firstName, dto.lastName, hashedPassword, dto.role);
			await this.userRepository.save(user);

			const tokens = await this.tokenService.generate({ id: user.id.value, email: user.email.value });

			return {
				user: {
					id: user.id.value,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email.value,
					role: user.role,
				},
				tokens,
			};
		});
	}
}
