import type {
  BookingCreatedRecord,
  BookingRepository,
} from "../../domain/booking/BookingRepository";
import type { TimeSlotRepository } from "../../domain/timeSlot/TimeSlotRepository";
import { BadRequestError, ForbiddenError } from "../../lib/error";
import type { Transaction } from "../../Transaction";

export class CancelBookingByMentorUseCase {
  constructor(
    private readonly transaction: Transaction,
    private readonly bookingRepository: BookingRepository,
    private readonly timeSlotRepository: TimeSlotRepository,
  ) {}

  async execute(
    bookingId: string,
    mentorId: string,
  ): Promise<BookingCreatedRecord> {
    return this.transaction.run(async () => {
      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking) {
        throw new BadRequestError("Booking not found");
      }

      if (booking.mentorId !== mentorId) {
        throw new ForbiddenError("Not authorized to cancel this booking");
      }

      if (
        booking.status === "COMPLETED" ||
        booking.status === "CANCELLED_BY_USER" ||
        booking.status === "CANCELLED_BY_MENTOR"
      ) {
        throw new BadRequestError("Cannot cancel this booking");
      }

      await this.timeSlotRepository.releaseAvailable(booking.timeSlotId);
      return this.bookingRepository.updateStatus(
        bookingId,
        "CANCELLED_BY_MENTOR",
        "cancelledAt",
      );
    });
  }
}
