import { prisma } from "../../prisma/client";
import { ITokenService, Tokens } from "../services/token.service";
import { IPasswordHasher } from "../services/password-hasher";

type UserRole = "MENTEE" | "MENTOR" | "ADMIN"

export type CreateUserDTO = {
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole,
}

type RegisteredUser = {
    user: {
        id: number,
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
        private readonly tokenService: ITokenService,
        private readonly hasher: IPasswordHasher
    ) { }

    //should be transaction
    async execute(dto: CreateUserDTO): Promise<RegisteredUser> {
        const exists = await prisma.user.findUnique({ where: { email: dto.email } });

        if (exists) {
            throw new EmailAlreadyTakenError('Email already in use');
        }

        const hashedPassword = await this.hasher.hash(dto.password);
        //TODO: Use Domain Object and repository
        const createdUser = await prisma.user.create({
            data: {
                email: dto.email,
                passwordHash: hashedPassword,
                role: dto.role,
                firstName: dto.firstName,
                lastName: dto.lastName
            }
        });

        const tokens = await this.tokenService.generate({ id: createdUser.id, email: createdUser.email });

        return {
            user: {
                id: createdUser.id,
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                email: createdUser.email,
                role: createdUser.role
            },
            tokens,
        }
    }
}