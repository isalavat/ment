import type { SlotStatus } from "@prisma/client";

export type TimeSlotRecord = {
  id: string;
  mentorId: string;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
};

export interface TimeSlotRepository {
  findById(slotId: string): Promise<TimeSlotRecord | null>;
  findByMentorAndRange(
    mentorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<TimeSlotRecord | null>;
  findBlockedOverlap(
    mentorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ id: string } | null>;
  create(input: {
    mentorId: string;
    startTime: Date;
    endTime: Date;
    status: SlotStatus;
  }): Promise<TimeSlotRecord>;
  claimAvailable(slotId: string): Promise<boolean>;
  releaseAvailable(slotId: string): Promise<void>;
}
