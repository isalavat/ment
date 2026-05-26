import { SlotStatus } from "@prisma/client";
import type {
  TimeSlotRecord,
  TimeSlotRepository,
} from "../../domain/timeSlot/TimeSlotRepository";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaTimeSlotRepository implements TimeSlotRepository {
  async findById(slotId: string): Promise<TimeSlotRecord | null> {
    const slot = await PrismaClientGetway().timeSlot.findUnique({
      where: { id: slotId },
    });

    return slot ?? null;
  }

  async findByMentorAndRange(
    mentorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<TimeSlotRecord | null> {
    const slot = await PrismaClientGetway().timeSlot.findFirst({
      where: {
        mentorId,
        startTime,
        endTime,
      },
    });

    return slot ?? null;
  }

  async findBlockedOverlap(
    mentorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ id: string } | null> {
    return PrismaClientGetway().timeSlot.findFirst({
      where: {
        mentorId,
        status: { in: [SlotStatus.BOOKED, SlotStatus.UNAVAILABLE] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });
  }

  async create(input: {
    mentorId: string;
    startTime: Date;
    endTime: Date;
    status: SlotStatus;
  }): Promise<TimeSlotRecord> {
    return PrismaClientGetway().timeSlot.create({
      data: input,
    });
  }

  async claimAvailable(slotId: string): Promise<boolean> {
    const claimed = await PrismaClientGetway().timeSlot.updateMany({
      where: {
        id: slotId,
        status: SlotStatus.AVAILABLE,
      },
      data: { status: SlotStatus.BOOKED },
    });

    return claimed.count === 1;
  }

  async releaseAvailable(slotId: string): Promise<void> {
    await PrismaClientGetway().timeSlot.update({
      where: { id: slotId },
      data: { status: SlotStatus.AVAILABLE },
    });
  }
}
