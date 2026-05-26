import type { TimeSlotManagementRepository } from "../../domain/timeSlot/TimeSlotManagementRepository";

export class GetAvailableSlotsUseCase {
  constructor(private readonly timeSlotRepo: TimeSlotManagementRepository) {}

  async execute(mentorId: string, startDate?: Date, endDate?: Date) {
    return this.timeSlotRepo.findAvailableForMentor(
      mentorId,
      startDate,
      endDate,
    );
  }
}
