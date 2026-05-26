import { BookingStatus, SlotStatus } from "@prisma/client";
import type { AvailabilityRepository } from "../../domain/availability/AvailabilityRepository";
import type {
  BookingCreatedRecord,
  BookingRepository,
} from "../../domain/booking/BookingRepository";
import type { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";
import type {
  TimeSlotRecord,
  TimeSlotRepository,
} from "../../domain/timeSlot/TimeSlotRepository";
import type { UserRepository } from "../../domain/user/UserRepository";
import { BadRequestError, ConflictError, NotFoundError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export type CreateBookingUseCaseInput = {
  menteeId: string;
  mentorId: string;
  timeSlotId?: string;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
};

function ensureValidInput(input: CreateBookingUseCaseInput) {
  if (!input.timeSlotId && (!input.startTime || !input.endTime)) {
    throw new BadRequestError(
      "Either timeSlotId or startTime/endTime is required",
    );
  }

  if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    throw new BadRequestError("startTime must be before endTime");
  }
}

function buildAvailabilityWindow(date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { dayStart, dayEnd };
}

function isWithinAvailabilityWindow(
  availability: {
    isRecurring: boolean;
    specificDate: Date | null;
    startTime: string;
    endTime: string;
  },
  startTime: Date,
  endTime: Date,
) {
  if (
    !availability.isRecurring &&
    availability.specificDate?.toDateString() !== startTime.toDateString()
  ) {
    return false;
  }

  const [startHour, startMinute] = availability.startTime
    .split(":")
    .map(Number);
  const [endHour, endMinute] = availability.endTime.split(":").map(Number);

  const windowStart = new Date(startTime);
  windowStart.setHours(startHour, startMinute, 0, 0);

  const windowEnd = new Date(startTime);
  windowEnd.setHours(endHour, endMinute, 0, 0);

  return startTime >= windowStart && endTime <= windowEnd;
}

function ensureMentorBelongsToSlot(mentorId: string, slotMentorId: string) {
  if (slotMentorId !== mentorId) {
    throw new BadRequestError("Time slot does not belong to this mentor");
  }
}

function ensureTimeSlotFound(timeSlot: TimeSlotRecord | null) {
  if (!timeSlot) {
    throw new NotFoundError("Time slot not found");
  }

  return timeSlot;
}

export class CreateBookingUseCase {
  constructor(
    private readonly transaction: Transaction,
    private readonly mentorRepository: MentorProfileRepository,
    private readonly userRepository: UserRepository,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly timeSlotRepository: TimeSlotRepository,
    private readonly bookingRepository: BookingRepository,
  ) {}

  async execute(
    input: CreateBookingUseCaseInput,
  ): Promise<BookingCreatedRecord> {
    ensureValidInput(input);

    return this.transaction.run(async () => {
      const mentor = await this.mentorRepository.findById(input.mentorId);
      if (!mentor) {
        throw new BadRequestError("Mentor profile not found");
      }

      const menteeUser = await this.userRepository.findById(input.menteeId);
      if (!menteeUser) {
        throw new BadRequestError("User not found");
      }

      let timeSlot = input.timeSlotId
        ? await this.timeSlotRepository.findById(input.timeSlotId)
        : input.startTime && input.endTime
          ? await this.timeSlotRepository.findByMentorAndRange(
              input.mentorId,
              input.startTime,
              input.endTime,
            )
          : null;

      if (!timeSlot && input.startTime && input.endTime) {
        const { dayStart, dayEnd } = buildAvailabilityWindow(input.startTime);
        const availabilities =
          await this.availabilityRepository.findForMentorInRange(
            input.mentorId,
            dayStart,
            dayEnd,
          );

        const withinAvailability = availabilities.some((availability) =>
          isWithinAvailabilityWindow(
            availability,
            input.startTime as Date,
            input.endTime as Date,
          ),
        );

        if (!withinAvailability) {
          throw new BadRequestError(
            "Selected time is outside mentor availability",
          );
        }

        const [blockedSlot, activeBooking] = await Promise.all([
          this.timeSlotRepository.findBlockedOverlap(
            input.mentorId,
            input.startTime,
            input.endTime,
          ),
          this.bookingRepository.findActiveOverlap(
            input.mentorId,
            input.startTime,
            input.endTime,
          ),
        ]);

        if (blockedSlot || activeBooking) {
          throw new ConflictError("Time slot is not available");
        }

        timeSlot = await this.timeSlotRepository.create({
          mentorId: input.mentorId,
          startTime: input.startTime,
          endTime: input.endTime,
          status: SlotStatus.AVAILABLE,
        });
      }

      timeSlot = ensureTimeSlotFound(timeSlot);
      ensureMentorBelongsToSlot(input.mentorId, timeSlot.mentorId);

      const claimed = await this.timeSlotRepository.claimAvailable(timeSlot.id);
      if (!claimed) {
        throw new ConflictError("Time slot is not available");
      }

      const duration = Math.round(
        (timeSlot.endTime.getTime() - timeSlot.startTime.getTime()) /
          (1000 * 60),
      );
      const totalAmount = mentor.hourlyRate * (duration / 60);

      return this.bookingRepository.create({
        mentorId: input.mentorId,
        menteeId: input.menteeId,
        timeSlotId: timeSlot.id,
        notes: input.notes,
        hourlyRate: mentor.hourlyRate,
        duration,
        totalAmount,
        currency: mentor.currency,
        status: BookingStatus.PENDING,
      });
    });
  }
}
