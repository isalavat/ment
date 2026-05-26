import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";
import { NotFoundError } from "../../lib/error";

export class GetAvailabilityByIdUseCase {
	constructor(private readonly availabilityRepo: AvailabilityManagementRepository) {}

	async execute(id: string) {
		const availability = await this.availabilityRepo.findByIdWithMentor(id);
		if (!availability) {
			throw new NotFoundError("Availability not found");
		}

		return availability;
	}
}
