import type { BookingCreatedRecord, BookingRepository } from "../../domain/booking/BookingRepository";
import { NotFoundError } from "../../lib/error";

export class GetBookingByIdUseCase {
	constructor(private readonly bookingRepository: BookingRepository) {}

	async execute(bookingId: string): Promise<BookingCreatedRecord> {
		const booking = await this.bookingRepository.findById(bookingId);
		if (!booking) {
			throw new NotFoundError("Booking not found");
		}

		return booking;
	}
}
