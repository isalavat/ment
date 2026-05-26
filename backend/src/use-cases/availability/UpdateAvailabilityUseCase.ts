import type { Prisma } from "@prisma/client";
import type { AvailabilityManagementRepository } from "../../domain/availability/AvailabilityManagementRepository";
import type { AvailabilitySlotSyncService } from "../../domain/availability/AvailabilitySlotSyncService";
import { ForbiddenError, NotFoundError } from "../../lib/error";
import {
  ensureStartBeforeEnd,
  ensureValidDayOfWeek,
  ensureValidTimeFormat,
} from "./validators";

export type UpdateAvailabilityInput = {
  id: string;
  mentorId: string;
  data: {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    isRecurring?: boolean;
    specificDate?: Date;
  };
};

export class UpdateAvailabilityUseCase {
  constructor(
    private readonly availabilityRepo: AvailabilityManagementRepository,
    private readonly slotSyncService: AvailabilitySlotSyncService,
  ) {}

  async execute(input: UpdateAvailabilityInput) {
    const availability = await this.availabilityRepo.findById(input.id);
    if (!availability) {
      throw new NotFoundError("Availability not found");
    }

    if (availability.mentorId !== input.mentorId) {
      throw new ForbiddenError("Not authorized to modify this availability");
    }

    if (input.data.startTime) {
      ensureValidTimeFormat("startTime", input.data.startTime);
    }

    if (input.data.endTime) {
      ensureValidTimeFormat("endTime", input.data.endTime);
    }

    const newStartTime = input.data.startTime ?? availability.startTime;
    const newEndTime = input.data.endTime ?? availability.endTime;
    ensureStartBeforeEnd(newStartTime, newEndTime);

    if (input.data.dayOfWeek !== undefined) {
      ensureValidDayOfWeek(input.data.dayOfWeek);
    }

    const updateData: Prisma.AvailabilityUpdateInput = {
      ...(input.data.dayOfWeek !== undefined
        ? { dayOfWeek: input.data.dayOfWeek }
        : {}),
      ...(input.data.startTime !== undefined
        ? { startTime: input.data.startTime }
        : {}),
      ...(input.data.endTime !== undefined
        ? { endTime: input.data.endTime }
        : {}),
      ...(input.data.isRecurring !== undefined
        ? { isRecurring: input.data.isRecurring }
        : {}),
      ...(input.data.specificDate !== undefined
        ? { specificDate: input.data.specificDate }
        : {}),
    };

    const updated = await this.availabilityRepo.update(input.id, updateData);
    await this.slotSyncService.reconcileForMentor(input.mentorId);

    return updated;
  }
}
