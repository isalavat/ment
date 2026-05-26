import type { SlotStatus } from "@prisma/client";
import type { TimeSlotManagementRepository } from "../../domain/timeSlot/TimeSlotManagementRepository";

export class GetAllSlotsForMentorUseCase {
  constructor(private readonly timeSlotRepo: TimeSlotManagementRepository) {}

  async execute(
    mentorId: string,
    startDate?: Date,
    endDate?: Date,
    status?: SlotStatus,
  ) {
    return this.timeSlotRepo.findAllForMentor(
      mentorId,
      startDate,
      endDate,
      status,
    );
  }
}
