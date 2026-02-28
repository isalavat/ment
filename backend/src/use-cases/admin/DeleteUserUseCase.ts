import type { UserRepository } from "../../domain/user/UserRepository";
import type { Transaction } from "../../Transaction";

export class DeleteUserUseCase {
  constructor(
    private readonly transaction: Transaction,
    private readonly userRepository: UserRepository
  ) {}

  async execute(requesterId: string, userId: string): Promise<void> {
    if (requesterId === userId) {
      throw new Error("Cannot delete your own account");
    }

    return this.transaction.run(async () => {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      await this.userRepository.delete(userId);
    });
  }
}
