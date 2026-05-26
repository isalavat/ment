import type { TimeSlotGenerationService } from "../../domain/timeSlot/TimeSlotGenerationService";

export class GenerateTimeSlotsUseCase {
  constructor(private readonly generationService: TimeSlotGenerationService) {}

  async execute(input: {
    mentorId: string;
    startDate: Date;
    endDate: Date;
    slotDuration?: number;
  }) {
    return this.generationService.generateTimeSlots(input);
  }
}
