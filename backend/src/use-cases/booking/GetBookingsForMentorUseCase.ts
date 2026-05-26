import type { BookingCreatedRecord, BookingRepository } from "../../domain/booking/BookingRepository";

export type GetBookingsForMentorInput = {
	mentorId: string;
	status?: BookingCreatedRecord["status"];
	startDate?: Date;
	endDate?: Date;
};

export class GetBookingsForMentorUseCase {
	constructor(private readonly bookingRepository: BookingRepository) {}

	async execute(input: GetBookingsForMentorInput): Promise<BookingCreatedRecord[]> {
		return this.bookingRepository.findForMentor(input.mentorId, {
			status: input.status,
			startDate: input.startDate,
			endDate: input.endDate,
		});
	}
}
