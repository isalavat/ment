import type { TimeSlotManagementRepository } from "../../domain/timeSlot/TimeSlotManagementRepository";
import { NotFoundError } from "../../lib/error";

export class GetTimeSlotByIdUseCase {
	constructor(private readonly timeSlotRepo: TimeSlotManagementRepository) {}

	async execute(slotId: string) {
		const slot = await this.timeSlotRepo.findById(slotId);
		if (!slot) {
			throw new NotFoundError("Time slot not found");
		}

		return slot;
	}
}
