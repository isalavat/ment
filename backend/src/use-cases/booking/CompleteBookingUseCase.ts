import type {
  BookingCreatedRecord,
  BookingRepository,
} from "../../domain/booking/BookingRepository";
import { BadRequestError } from "../../lib/error";

export class CompleteBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(bookingId: string): Promise<BookingCreatedRecord> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BadRequestError("Booking not found");
    }

    if (booking.status !== "CONFIRMED") {
      throw new BadRequestError("Only confirmed bookings can be completed");
    }

    return this.bookingRepository.updateStatus(
      bookingId,
      "COMPLETED",
      "completedAt",
    );
  }
}
