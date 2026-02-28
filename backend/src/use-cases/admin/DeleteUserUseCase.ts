import type { UserRepository } from "../../domain/user/UserRepository";
import { ForbiddenError, NotFoundError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export class DeleteUserUseCase {
	constructor(
		private readonly transaction: Transaction,
		private readonly userRepository: UserRepository,
	) {}

	async execute(requesterId: string, userId: string): Promise<void> {
		if (requesterId === userId) {
			throw new ForbiddenError("Cannot delete your own account");
		}

		return this.transaction.run(async () => {
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw new NotFoundError("User not found");
			}

			await this.userRepository.delete(userId);
		});
	}
}
