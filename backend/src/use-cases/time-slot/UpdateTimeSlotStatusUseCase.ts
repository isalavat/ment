import type { SlotStatus } from "@prisma/client";
import type { TimeSlotManagementRepository } from "../../domain/timeSlot/TimeSlotManagementRepository";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../lib/error";

export class UpdateTimeSlotStatusUseCase {
	constructor(private readonly timeSlotRepo: TimeSlotManagementRepository) {}

	async execute(slotId: string, status: SlotStatus, mentorId: string) {
		const slot = await this.timeSlotRepo.findById(slotId);
		if (!slot) {
			throw new NotFoundError("Time slot not found");
		}

		if (slot.mentorId !== mentorId) {
			throw new ForbiddenError("Not authorized to update this time slot");
		}

		if (slot.booking && status !== "BOOKED") {
			throw new BadRequestError("Cannot change status of a booked slot");
		}

		return this.timeSlotRepo.updateStatus(slotId, status);
	}
}
