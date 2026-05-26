import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";

export class GetRecurringAvailabilitiesUseCase {
	constructor(private readonly availabilityRepo: AvailabilityManagementRepository) {}

	async execute(mentorId: string, dayOfWeek?: number) {
		return this.availabilityRepo.findRecurringForMentor(mentorId, dayOfWeek);
	}
}
