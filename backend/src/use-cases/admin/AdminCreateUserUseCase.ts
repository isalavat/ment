import { User, type UserRole } from "../../domain/user/User";
import type { UserRepository } from "../../domain/user/UserRepository";
import { Email } from "../../domain/user/value-objects/Email";
import { UserId } from "../../domain/user/value-objects/UserId";
import type { PasswordHasher } from "../../services/PasswordHasher";
import { UserAlreadyExistsError } from "../errors/UserAlreadyExistsError";

export type AdminCreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
};

export class AdminCreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: AdminCreateUserInput): Promise<User> {
    const email = Email.from(input.email);

    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      throw new UserAlreadyExistsError(email.value);
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);

    const user = User.create(
      UserId.generate(),
      email,
      input.firstName,
      input.lastName,
      hashedPassword,
      input.role,
      input.avatarUrl ?? null
    );

    return this.userRepository.save(user);
  }
}
