import { User, type UserRole } from "../../domain/user/User";
import type { UserRepository } from "../../domain/user/UserRepository";
import { Email } from "../../domain/user/value-objects/Email";
import type { PasswordHasher } from "../../services/PasswordHasher";
import type { Transaction } from "../../Transaction";

export type UpdateUserInput = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  avatarUrl?: string | null;
};

export class UpdateUserUseCase {
  constructor(
    private readonly transaction: Transaction,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(userId: string, input: UpdateUserInput): Promise<User> {
    return this.transaction.run(async () => {
      const current = await this.userRepository.findById(userId);
      if (!current) {
        throw new Error("User not found");
      }

      if (input.email) {
        const newEmail = Email.from(input.email);
        if (newEmail.value !== current.email.value) {
          const taken = await this.userRepository.existsByEmail(newEmail);
          if (taken) {
            throw new Error("Email already in use");
          }
        }
      }

      const updatedEmail = input.email
        ? Email.from(input.email)
        : current.email;
      const updatedPassword = input.password
        ? await this.passwordHasher.hash(input.password)
        : current.hashedPassword;

      const updated = User.create(
        current.id,
        updatedEmail,
        input.firstName ?? current.firstName,
        input.lastName ?? current.lastName,
        updatedPassword,
        input.role ?? current.role,
        input.avatarUrl !== undefined ? input.avatarUrl : current.avatarUrl
      );

      return this.userRepository.update(updated);
    });
  }
}
