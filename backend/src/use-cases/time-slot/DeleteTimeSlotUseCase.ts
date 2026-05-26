import type { TimeSlotManagementRepository } from "../../domain/timeSlot/TimeSlotManagementRepository";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../lib/error";

export class DeleteTimeSlotUseCase {
  constructor(private readonly timeSlotRepo: TimeSlotManagementRepository) {}

  async execute(slotId: string, mentorId: string) {
    const slot = await this.timeSlotRepo.findById(slotId);
    if (!slot) {
      throw new NotFoundError("Time slot not found");
    }

    if (slot.mentorId !== mentorId) {
      throw new ForbiddenError("Not authorized to delete this time slot");
    }

    if (slot.booking) {
      throw new BadRequestError("Cannot delete a booked time slot");
    }

    await this.timeSlotRepo.delete(slotId);
    return { success: true, message: "Time slot deleted" };
  }
}
