import { SlotStatus } from "@prisma/client";
import type { AvailabilitySlotSyncService } from "../../domain/availability/AvailabilitySlotSyncService";
import { PrismaClientGetway } from "../PrismaClientGetway";
import { TimeSlotGenerationPrismaService } from "./TimeSlotGenerationPrismaService";

const AUTO_SLOT_HORIZON_DAYS = 60;
const AUTO_SLOT_DURATION_MINUTES = 60;

function getAutoSyncRange() {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + AUTO_SLOT_HORIZON_DAYS);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export class AvailabilitySlotSyncPrismaService implements AvailabilitySlotSyncService {
  async reconcileForMentor(mentorId: string): Promise<void> {
    const { startDate, endDate } = getAutoSyncRange();

    await PrismaClientGetway().timeSlot.deleteMany({
      where: {
        mentorId,
        status: SlotStatus.AVAILABLE,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    await new TimeSlotGenerationPrismaService().generateTimeSlots({
      mentorId,
      startDate,
      endDate,
      slotDuration: AUTO_SLOT_DURATION_MINUTES,
    });
  }
}
