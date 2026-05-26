import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";
import type { AvailabilitySlotSyncService } from "../../domain/availability/AvailabilitySlotSyncService";
import { ForbiddenError, NotFoundError } from "../../lib/error";

export class DeleteAvailabilityUseCase {
	constructor(
		private readonly availabilityRepo: AvailabilityManagementRepository,
		private readonly slotSyncService: AvailabilitySlotSyncService,
	) {}

	async execute(id: string, mentorId: string) {
		const availability = await this.availabilityRepo.findById(id);
		if (!availability) {
			throw new NotFoundError("Availability not found");
		}

		if (availability.mentorId !== mentorId) {
			throw new ForbiddenError("Not authorized to modify this availability");
		}

		await this.availabilityRepo.delete(id);
		await this.slotSyncService.reconcileForMentor(mentorId);

		return { success: true, message: "Availability deleted" };
	}
}
