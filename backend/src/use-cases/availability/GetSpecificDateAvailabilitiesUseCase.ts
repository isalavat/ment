import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";

export class GetSpecificDateAvailabilitiesUseCase {
	constructor(private readonly availabilityRepo: AvailabilityManagementRepository) {}

	async execute(mentorId: string, date?: Date) {
		return this.availabilityRepo.findSpecificDateForMentor(mentorId, date);
	}
}
