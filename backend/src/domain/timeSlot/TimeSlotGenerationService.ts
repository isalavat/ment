export type GenerateTimeSlotsInput = {
  mentorId: string;
  startDate: Date;
  endDate: Date;
  slotDuration?: number;
};

export type ComputeBookableSlotsInput = {
  mentorId: string;
  startDate: Date;
  endDate: Date;
  stepMinutes?: number;
  durationMinutes?: number;
};

export interface TimeSlotGenerationService {
  generateTimeSlots(
    input: GenerateTimeSlotsInput,
  ): Promise<{ count: number; message: string }>;
  getComputedBookableSlots(
    input: ComputeBookableSlotsInput,
  ): Promise<unknown[]>;
}
