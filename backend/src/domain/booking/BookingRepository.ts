import type { BookingStatus, SlotStatus } from "@prisma/client";

export type BookingCreatedRecord = {
	id: string;
	mentorId: string;
	menteeId: string;
	timeSlotId: string;
	notes: string | null;
	status: BookingStatus;
	hourlyRate: number;
	duration: number;
	totalAmount: number;
	currency: string;
	meetingLink: string | null;
	createdAt: Date;
	updatedAt: Date;
	confirmedAt: Date | null;
	completedAt: Date | null;
	cancelledAt: Date | null;
	mentor: {
		id: string;
		title: string;
		user: {
			firstName: string;
			lastName: string;
			email: string;
			avatarUrl: string | null;
		};
	};
	mentee: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		avatarUrl: string | null;
	};
	timeSlot: {
		id: string;
		mentorId: string;
		startTime: Date;
		endTime: Date;
		status: SlotStatus;
	};
	review?: {
		id: string;
		rating: number;
		comment?: string | null;
	};
};

export type CreateBookingRecord = {
	mentorId: string;
	menteeId: string;
	timeSlotId: string;
	notes?: string;
	hourlyRate: number;
	duration: number;
	totalAmount: number;
	currency: string;
	status: BookingStatus;
};

export interface BookingRepository {
	findById(bookingId: string): Promise<BookingCreatedRecord | null>;
	findForMentee(
		menteeId: string,
		filters?: { status?: BookingStatus; startDate?: Date; endDate?: Date },
	): Promise<BookingCreatedRecord[]>;
	findForMentor(
		mentorId: string,
		filters?: { status?: BookingStatus; startDate?: Date; endDate?: Date },
	): Promise<BookingCreatedRecord[]>;
	findActiveOverlap(mentorId: string, startTime: Date, endTime: Date): Promise<{ id: string } | null>;
	create(input: CreateBookingRecord): Promise<BookingCreatedRecord>;
	updateStatus(
		bookingId: string,
		status: BookingStatus,
		timestampField?: "confirmedAt" | "completedAt" | "cancelledAt",
	): Promise<BookingCreatedRecord>;
	updateMeetingLink(bookingId: string, meetingLink: string): Promise<BookingCreatedRecord>;
}
