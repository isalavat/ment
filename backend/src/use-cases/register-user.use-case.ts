import { ITokenService, Tokens } from "../services/token.service";
import { User, UserRole } from "../domain/user/User";
import { IPasswordHasher } from "../services/password-hasher";
import { Transaction } from "../Transaction";
import { getPrismaClient } from "../infra/PrismaTransaction";
import { HashedPassword } from "../domain/user/HashedPassword";
import { UserRepository } from "../domain/user/UserRepository";
import { UserId } from "../domain/user/UserId";
import { Email } from "../domain/user/Email";

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

export class EmailAlreadyTakenError extends Error {
    readonly code = 'EMAIL_ALREADY_TAKEN'
}

export class RegisterUserUseCase {
    constructor(
        private readonly transaction: Transaction,
        private readonly userRepository: UserRepository,
        private readonly tokenService: ITokenService,
        private readonly hasher: IPasswordHasher
    ) { }

    //should be transaction
    async execute(dto: CreateUserDTO): Promise<RegisteredUser> {
        return await this.transaction.run(async () => {
            const exists = await getPrismaClient().user.findUnique({ where: { email: dto.email } });

            if (exists) {
                throw new EmailAlreadyTakenError('Email already in use');
            }

            const hashedPassword = await this.hasher.hash(dto.password);
            
            const user = User.create(UserId.generate(), Email.from(dto.email), dto.firstName, dto.lastName, HashedPassword.fromHash(hashedPassword), dto.role);
            this.userRepository.save(user);

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