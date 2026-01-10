import { User } from "../domain/user/User";
import { User as PrismaUser } from '@prisma/client'
import { UserRepository } from "../domain/user/UserRepository";
import { HashedPassword } from "../domain/user/HashedPassword";
import { prisma } from "../../prisma/client";
import { UserId } from "../domain/user/UserId";
import { Email } from "../domain/user/Email";

export class PrismaUserRepository implements UserRepository {

    async save(user: User): Promise<User> {
        const result = await prisma.user.create({
            data: {
                id: user.id.value,
                email: user.email.value,
                passwordHash: user.hashedPassword.value,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        })
        return this.toUser(result);
    }

    private toUser(fromPrisma: PrismaUser): User {
        return User.create(
            UserId.fromString(fromPrisma.id),
            Email.from(fromPrisma.email),
            fromPrisma.firstName,
            fromPrisma.lastName,
            HashedPassword.fromHash(fromPrisma.passwordHash),
            fromPrisma.role
        )
    }

}