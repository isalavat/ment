import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";
import type { AvailabilitySlotSyncService } from "../../domain/availability/AvailabilitySlotSyncService";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import { BadRequestError, NotFoundError } from "../../lib/error";
import {
  ensureStartBeforeEnd,
  ensureValidDayOfWeek,
  ensureValidTimeFormat,
} from "./validators";

export type CreateAvailabilityInput = {
  mentorId: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  specificDate?: Date;
};

export class CreateAvailabilityUseCase {
  constructor(
    private readonly mentorRepo: MentorProfileRepository,
    private readonly availabilityRepo: AvailabilityManagementRepository,
    private readonly slotSyncService: AvailabilitySlotSyncService,
  ) {}

  async execute(input: CreateAvailabilityInput) {
    const {
      mentorId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring = true,
      specificDate,
    } = input;

    ensureValidTimeFormat("startTime", startTime);
    ensureValidTimeFormat("endTime", endTime);
    ensureStartBeforeEnd(startTime, endTime);

    if (isRecurring && dayOfWeek === undefined) {
      throw new BadRequestError(
        "dayOfWeek is required for recurring availability",
      );
    }

    if (!isRecurring && !specificDate) {
      throw new BadRequestError(
        "specificDate is required for non-recurring availability",
      );
    }

    if (isRecurring && dayOfWeek !== undefined) {
      ensureValidDayOfWeek(dayOfWeek);
    }

    const mentor = await this.mentorRepo.findById(mentorId);
    if (!mentor) {
      throw new NotFoundError("Mentor not found");
    }

    const availability = await this.availabilityRepo.create({
      mentorId,
      dayOfWeek: isRecurring && dayOfWeek !== undefined ? dayOfWeek : 0,
      startTime,
      endTime,
      isRecurring,
      specificDate,
    });

    await this.slotSyncService.reconcileForMentor(mentorId);

    return availability;
  }
}
