import type { TimeSlotManagementRepository } from "../../domain/timeSlot/TimeSlotManagementRepository";
import { BadRequestError } from "../../lib/error";

export class BulkDeleteTimeSlotsUseCase {
	constructor(private readonly timeSlotRepo: TimeSlotManagementRepository) {}

	async execute(mentorId: string, startDate: Date, endDate: Date) {
		if (startDate >= endDate) {
			throw new BadRequestError("Start date must be before end date");
		}

		const result = await this.timeSlotRepo.deleteAvailableForMentorInRange(mentorId, startDate, endDate);
		return {
			count: result.count,
			message: `Deleted ${result.count} available time slots`,
		};
	}
}
