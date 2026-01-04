import bcrypt from "bcryptjs";
import { prisma } from "../../prisma/client";
import { CreateUserDTO } from "../schemas/auth.schemas";

//TODO: should it be abstract UseCasesError and DomainError?
export class EmailAlreadyTakenError extends Error {
    readonly code = 'EMAIL_ALREADY_TAKEN'
}

export type CreatedUser = { id: number } & Omit<CreateUserDTO, 'password'>

//TODO: use aggregate and repository later instead of prisma calls?
export const createUserUseCase = async ({ email, firstName, lastName, password, role }: CreateUserDTO): Promise<CreatedUser> => {
    const exists = await prisma.user.findUnique({ where: { email } });

    if (exists) {
        throw new EmailAlreadyTakenError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const createdUser = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role,
            firstName,
            lastName
        }
    });

    return {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role
    }
};