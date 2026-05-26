import type { TimeSlotGenerationService } from "../../domain/timeSlot/TimeSlotGenerationService";

export class GetComputedBookableSlotsUseCase {
  constructor(private readonly generationService: TimeSlotGenerationService) {}

  async execute(input: {
    mentorId: string;
    startDate: Date;
    endDate: Date;
    stepMinutes?: number;
    durationMinutes?: number;
  }) {
    return this.generationService.getComputedBookableSlots(input);
  }
}
