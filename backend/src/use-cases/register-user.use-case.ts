import { ITokenService, Tokens } from "../services/token.service";
import { User, UserRole } from "../domain/user/User";
import { IPasswordHasher } from "../services/password-hasher";
import { Transaction } from "../Transaction";
import { HashedPassword } from "../domain/user/value-objects/HashedPassword";
import { UserRepository } from "../domain/user/UserRepository";
import { UserId } from "../domain/user/value-objects/UserId";
import { Email } from "../domain/user/value-objects/Email";
import { UserAlreadyExistsError } from "./UserAlreadyExistsError";

export type CreateUserDTO = {
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole,
}

type RegisteredUser = {
    user: {
        id: string,
        email: string,
        firstName: string,
        lastName: string,
        role: UserRole,
    },
    tokens: Tokens
}

export class RegisterUserUseCase {
    constructor(
        private readonly transaction: Transaction,
        private readonly userRepository: UserRepository,
        private readonly tokenService: ITokenService,
        private readonly hasher: IPasswordHasher
    ) { }

    async execute(dto: CreateUserDTO): Promise<RegisteredUser> {
        return await this.transaction.run(async () => {
            const email = Email.from(dto.email);
            const existed = await this.userRepository.existsByEmail(email)

            if (existed) {
                throw new UserAlreadyExistsError(email.value);
            }

            const hashedPassword = await this.hasher.hash(dto.password);
            
            const user = User.create(UserId.generate(), email, dto.firstName, dto.lastName, HashedPassword.fromHash(hashedPassword), dto.role);
            await this.userRepository.save(user);

            const tokens = await this.tokenService.generate({ id: user.id.value, email: user.email.value });

            return {
                user: {
                    id: user.id.value,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email.value,
                    role: user.role
                },
                tokens,
            }
        });
    }
}