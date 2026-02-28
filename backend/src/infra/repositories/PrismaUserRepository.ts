import type { User as PrismaUser } from "@prisma/client";
import { User } from "../../domain/user/User";
import type { UserRepository } from "../../domain/user/UserRepository";
import { Email } from "../../domain/user/value-objects/Email";
import { HashedPassword } from "../../domain/user/value-objects/HashedPassword";
import { UserId } from "../../domain/user/value-objects/UserId";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaUserRepository implements UserRepository {
	async save(user: User): Promise<User> {
		const result = await PrismaClientGetway().user.create({
			data: {
				id: user.id.value,
				email: user.email.value,
				passwordHash: user.hashedPassword.value,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
				avatarUrl: user.avatarUrl,
			},
		});
		return this.toUser(result);
	}

	async existsByEmail(email: Email): Promise<boolean> {
		const result = await PrismaClientGetway().user.findUnique({
			where: { email: email.value },
		});
		if (result === null) {
			return false;
		}
		return true;
	}

	async findById(id: string): Promise<User | null> {
		const result = await PrismaClientGetway().user.findUnique({
			where: { id },
		});
		return result ? this.toUser(result) : null;
	}

	async findByEmail(email: Email): Promise<User | null> {
		const result = await PrismaClientGetway().user.findUnique({
			where: { email: email.value },
		});
		return result ? this.toUser(result) : null;
	}

	async update(user: User): Promise<User> {
		const result = await PrismaClientGetway().user.update({
			where: { id: user.id.value },
			data: {
				email: user.email.value,
				passwordHash: user.hashedPassword.value,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
				avatarUrl: user.avatarUrl,
			},
		});
		return this.toUser(result);
	}

	async delete(id: string): Promise<void> {
		await PrismaClientGetway().user.delete({ where: { id } });
	}

	private toUser(fromPrisma: PrismaUser): User {
		return User.create(
			UserId.fromString(fromPrisma.id),
			Email.from(fromPrisma.email),
			fromPrisma.firstName,
			fromPrisma.lastName,
			HashedPassword.fromHash(fromPrisma.passwordHash),
			fromPrisma.role,
			fromPrisma.avatarUrl,
		);
	}
}
