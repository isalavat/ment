import type { BookingCreatedRecord, BookingRepository } from "../../domain/booking/BookingRepository";

export type GetBookingsForMenteeInput = {
	menteeId: string;
	status?: BookingCreatedRecord["status"];
	startDate?: Date;
	endDate?: Date;
};

export class GetBookingsForMenteeUseCase {
	constructor(private readonly bookingRepository: BookingRepository) {}

	async execute(input: GetBookingsForMenteeInput): Promise<BookingCreatedRecord[]> {
		return this.bookingRepository.findForMentee(input.menteeId, {
			status: input.status,
			startDate: input.startDate,
			endDate: input.endDate,
		});
	}
}
