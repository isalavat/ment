import { BookingStatus, SlotStatus } from "@prisma/client";
import type {
  ComputeBookableSlotsInput,
  GenerateTimeSlotsInput,
  TimeSlotGenerationService,
} from "../../domain/timeSlot/TimeSlotGenerationService";
import { BadRequestError } from "../../lib/error";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class TimeSlotGenerationPrismaService implements TimeSlotGenerationService {
  async generateTimeSlots(
    input: GenerateTimeSlotsInput,
  ): Promise<{ count: number; message: string }> {
    const { mentorId, startDate, endDate, slotDuration = 60 } = input;

    if (startDate >= endDate) {
      throw new BadRequestError("Start date must be before end date");
    }

    const availabilities = await PrismaClientGetway().availability.findMany({
      where: { mentorId },
    });

    if (availabilities.length === 0) {
      return { count: 0, message: "No availabilities found for this mentor" };
    }

    const slotsToCreate: Array<{
      mentorId: string;
      startTime: Date;
      endTime: Date;
      status: SlotStatus;
    }> = [];

    for (const currentDate of this.iterateDays(startDate, endDate)) {
      const daySlots = this.buildSlotsForDate(
        currentDate,
        availabilities,
        mentorId,
        slotDuration,
      );
      slotsToCreate.push(...daySlots);
    }

    const existingSlots = await PrismaClientGetway().timeSlot.findMany({
      where: {
        mentorId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const newSlots = slotsToCreate.filter(
      (newSlot) =>
        !existingSlots.some(
          (existing) =>
            existing.startTime.getTime() === newSlot.startTime.getTime(),
        ),
    );

    if (newSlots.length === 0) {
      return { count: 0, message: "No new slots to create" };
    }

    const result = await PrismaClientGetway().timeSlot.createMany({
      data: newSlots,
      skipDuplicates: true,
    });

    return {
      count: result.count,
      message: `Created ${result.count} time slots`,
    };
  }

  async getComputedBookableSlots(
    input: ComputeBookableSlotsInput,
  ): Promise<unknown[]> {
    const {
      mentorId,
      startDate,
      endDate,
      stepMinutes = 15,
      durationMinutes = 60,
    } = input;

    if (startDate >= endDate) {
      throw new BadRequestError("Start date must be before end date");
    }

    if (stepMinutes <= 0 || durationMinutes <= 0) {
      throw new BadRequestError(
        "stepMinutes and durationMinutes must be positive",
      );
    }

    const availabilities = await PrismaClientGetway().availability.findMany({
      where: {
        mentorId,
        OR: [
          { isRecurring: true },
          {
            isRecurring: false,
            specificDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
    });

    if (availabilities.length === 0) {
      return [];
    }

    const [blockedTimeSlots, activeBookings] = await Promise.all([
      PrismaClientGetway().timeSlot.findMany({
        where: {
          mentorId,
          status: { in: [SlotStatus.BOOKED, SlotStatus.UNAVAILABLE] },
          startTime: { lt: endDate },
          endTime: { gt: startDate },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      }),
      PrismaClientGetway().booking.findMany({
        where: {
          mentorId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          timeSlot: {
            startTime: { lt: endDate },
            endTime: { gt: startDate },
          },
        },
        select: {
          timeSlot: {
            select: {
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
    ]);

    const blockedIntervals = [
      ...blockedTimeSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      ...activeBookings.map((booking) => ({
        startTime: booking.timeSlot.startTime,
        endTime: booking.timeSlot.endTime,
      })),
    ];

    const results: Array<{
      id: string;
      mentorId: string;
      startTime: Date;
      endTime: Date;
      status: SlotStatus;
    }> = [];
    const dedupe = new Set<string>();

    for (const cursorDay of this.iterateDays(startDate, endDate)) {
      const dayOfWeek = cursorDay.getDay();
      const dayKey = cursorDay.toDateString();

      const dayAvailabilities = availabilities.filter((availability) =>
        availability.isRecurring
          ? availability.dayOfWeek === dayOfWeek
          : availability.specificDate?.toDateString() === dayKey,
      );

      for (const availability of dayAvailabilities) {
        const [startHour, startMinute] = availability.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = availability.endTime
          .split(":")
          .map(Number);

        const windowStart = new Date(cursorDay);
        windowStart.setHours(startHour, startMinute, 0, 0);

        const windowEnd = new Date(cursorDay);
        windowEnd.setHours(endHour, endMinute, 0, 0);

        for (
          let slotStartMs = windowStart.getTime();
          slotStartMs + durationMinutes * 60_000 <= windowEnd.getTime();
          slotStartMs += stepMinutes * 60_000
        ) {
          const slotStart = new Date(slotStartMs);
          const slotEnd = new Date(slotStartMs + durationMinutes * 60_000);

          if (slotStart < startDate || slotEnd > endDate) {
            continue;
          }

          const hasOverlap = blockedIntervals.some(
            (interval) =>
              interval.startTime < slotEnd && interval.endTime > slotStart,
          );

          if (hasOverlap) {
            continue;
          }

          const key = `${slotStart.toISOString()}|${slotEnd.toISOString()}`;
          if (dedupe.has(key)) {
            continue;
          }
          dedupe.add(key);

          results.push({
            id: `computed-${mentorId}-${slotStart.toISOString()}-${durationMinutes}`,
            mentorId,
            startTime: slotStart,
            endTime: slotEnd,
            status: SlotStatus.AVAILABLE,
          });
        }
      }
    }

    return results.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
  }

  private iterateDays(startDate: Date, endDate: Date) {
    const cursorDay = new Date(startDate);
    cursorDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(endDate);
    lastDay.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    while (cursorDay <= lastDay) {
      days.push(new Date(cursorDay));
      cursorDay.setDate(cursorDay.getDate() + 1);
    }

    return days;
  }

  private buildSlotsForDate(
    date: Date,
    availabilities: Array<{
      isRecurring: boolean;
      dayOfWeek: number;
      specificDate: Date | null;
      startTime: string;
      endTime: string;
    }>,
    mentorId: string,
    slotDuration: number,
  ) {
    const slots: Array<{
      mentorId: string;
      startTime: Date;
      endTime: Date;
      status: SlotStatus;
    }> = [];

    const dayOfWeek = date.getDay();
    const dayKey = date.toDateString();
    const matchedAvailabilities = availabilities.filter((availability) =>
      availability.isRecurring
        ? availability.dayOfWeek === dayOfWeek
        : availability.specificDate?.toDateString() === dayKey,
    );

    for (const availability of matchedAvailabilities) {
      slots.push(
        ...this.generateSlotsForDay(
          date,
          availability.startTime,
          availability.endTime,
          mentorId,
          slotDuration,
        ),
      );
    }

    return slots;
  }

  private generateSlotsForDay(
    date: Date,
    startTimeStr: string,
    endTimeStr: string,
    mentorId: string,
    slotDuration: number,
  ) {
    const slots: Array<{
      mentorId: string;
      startTime: Date;
      endTime: Date;
      status: SlotStatus;
    }> = [];

    const [startHour, startMin] = startTimeStr.split(":").map(Number);
    const [endHour, endMin] = endTimeStr.split(":").map(Number);

    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMin, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMin, 0, 0);

    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);

      if (slotEnd <= dayEnd) {
        slots.push({
          mentorId,
          startTime: new Date(slotStart),
          endTime: new Date(slotEnd),
          status: SlotStatus.AVAILABLE,
        });
      }

      slotStart.setMinutes(slotStart.getMinutes() + slotDuration);
    }

    return slots;
  }
}
