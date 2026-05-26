import type { BookingCreatedRecord, BookingRepository } from "../../domain/booking/BookingRepository";
import { BadRequestError, ForbiddenError } from "../../lib/error";

export class UpdateMeetingLinkUseCase {
	constructor(private readonly bookingRepository: BookingRepository) {}

	async execute(bookingId: string, mentorId: string, meetingLink: string): Promise<BookingCreatedRecord> {
		if (!meetingLink) {
			throw new BadRequestError("meetingLink is required");
		}

		const booking = await this.bookingRepository.findById(bookingId);
		if (!booking) {
			throw new BadRequestError("Booking not found");
		}

		if (booking.mentorId !== mentorId) {
			throw new ForbiddenError("Not authorized to update this booking");
		}

		return this.bookingRepository.updateMeetingLink(bookingId, meetingLink);
	}
}
