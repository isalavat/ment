import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";

export class GetAvailabilitiesForMentorUseCase {
	constructor(private readonly availabilityRepo: AvailabilityManagementRepository) {}

	async execute(mentorId: string) {
		return this.availabilityRepo.findForMentor(mentorId);
	}
}
