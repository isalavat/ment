import type { User } from "../../domain/user/User";
import type { UpdateProfileData, UserRepository } from "../../domain/user/UserRepository";
import { NotFoundError } from "../../lib/error";

export class UpdateMyProfileUseCase {
	constructor(private readonly userRepo: UserRepository) {}

	async execute(userId: string, data: UpdateProfileData): Promise<User> {
		const user = await this.userRepo.findById(userId);
		if (!user) throw new NotFoundError("User not found");
		return this.userRepo.updateProfile(userId, data);
	}
}
