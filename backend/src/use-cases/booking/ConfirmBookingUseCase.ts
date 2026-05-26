import type {
  BookingCreatedRecord,
  BookingRepository,
} from "../../domain/booking/BookingRepository";
import { BadRequestError, ForbiddenError } from "../../lib/error";

export class ConfirmBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(
    bookingId: string,
    mentorId: string,
  ): Promise<BookingCreatedRecord> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BadRequestError("Booking not found");
    }

    if (booking.mentorId !== mentorId) {
      throw new ForbiddenError("Not authorized to confirm this booking");
    }

    if (booking.status !== "PENDING") {
      throw new BadRequestError("Only pending bookings can be confirmed");
    }

    return this.bookingRepository.updateStatus(
      bookingId,
      "CONFIRMED",
      "confirmedAt",
    );
  }
}
