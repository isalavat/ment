import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";
import type { AvailabilitySlotSyncService } from "../../domain/availability/AvailabilitySlotSyncService";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import { NotFoundError } from "../../lib/error";
import {
  ensureStartBeforeEnd,
  ensureValidDayOfWeek,
  ensureValidTimeFormat,
} from "./validators";

export type CreateWeeklyScheduleInput = {
  mentorId: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

export class CreateWeeklyScheduleUseCase {
  constructor(
    private readonly mentorRepo: MentorProfileRepository,
    private readonly availabilityRepo: AvailabilityManagementRepository,
    private readonly slotSyncService: AvailabilitySlotSyncService,
  ) {}

  async execute(input: CreateWeeklyScheduleInput) {
    const mentor = await this.mentorRepo.findById(input.mentorId);
    if (!mentor) {
      throw new NotFoundError("Mentor not found");
    }

    for (const slot of input.schedule) {
      ensureValidDayOfWeek(slot.dayOfWeek);
      ensureValidTimeFormat("startTime", slot.startTime);
      ensureValidTimeFormat("endTime", slot.endTime);
      ensureStartBeforeEnd(slot.startTime, slot.endTime);
    }

    const created = await this.availabilityRepo.createWeekly({
      mentorId: input.mentorId,
      schedule: input.schedule,
    });

    await this.slotSyncService.reconcileForMentor(input.mentorId);

    return {
      count: created.count,
      message: `Created ${created.count} availability slots`,
    };
  }
}
